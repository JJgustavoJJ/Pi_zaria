import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import LiveMap from "./LiveMap";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function request(path, options = {}, token) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Não foi possível concluir a operação.");
  return data;
}

const roles = [
  { id: "cliente", title: "Cliente", description: "Acesse seus pedidos e acompanhe a entrega.", symbol: "C" },
  { id: "motoboy", title: "Motoboy", description: "Visualize entregas e compartilhe sua localização.", symbol: "M" },
  { id: "admin", title: "Estabelecimento", description: "Gerencie pedidos e atribua entregas.", symbol: "E" },
];

export default function DeliveryAccess() {
  const [screen, setScreen] = useState("roles");
  const [role, setRole] = useState("cliente");
  const [mode, setMode] = useState("login");
  const [trackingCode, setTrackingCode] = useState("");
  const [tracking, setTracking] = useState(null);
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "" });
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [adminDrivers, setAdminDrivers] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const watchId = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!tracking?.trackingCode) return;
    const socket = io(API, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.emit("tracking:join", tracking.trackingCode);
    socket.on("tracking:update", (update) => setTracking((current) => current ? { ...current, ...update } : current));
    return () => socket.disconnect();
  }, [tracking?.trackingCode]);

  async function findTracking(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const data = await request(`/api/tracking/${encodeURIComponent(trackingCode.trim())}`);
      setTracking(data); setScreen("tracking");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const data = mode === "register"
        ? await request("/api/auth/register-customer", { method: "POST", body: JSON.stringify(credentials) })
        : await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: credentials.email, password: credentials.password }) });
      if (data.user.role !== role) throw new Error("Esta conta não pertence a esse tipo de acesso.");
      setSession(data);
      if (role === "admin") { await loadAdmin(data.token); setScreen("admin"); }
      else if (role === "motoboy") { await loadOrders(data.token); setScreen("driver"); }
      else setScreen("customer");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function loadOrders(token = session?.token) {
    if (!token) return;
    try { const data = await request("/api/driver/orders", {}, token); setOrders(data.orders || []); }
    catch (error) { setMessage(error.message); }
  }

  async function loadAdmin(token = session?.token) {
    if (!token) return;
    try { const data = await request("/api/admin/orders", {}, token); setOrders(data.orders || []); setAdminDrivers(data.drivers || []); }
    catch (error) { setMessage(error.message); }
  }

  async function assignDriver(orderId, driverId) {
    try {
      await request(`/api/admin/orders/${orderId}/assign`, { method: "POST", body: JSON.stringify({ driverId: Number(driverId) }) }, session.token);
      await loadAdmin(); setMessage("Motoboy atribuído ao pedido.");
    } catch (error) { setMessage(error.message); }
  }

  async function updateStatus(orderId, status) {
    try {
      await request(`/api/driver/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, session.token);
      await loadOrders();
      setMessage(status === "out_for_delivery" ? "Entrega iniciada. Compartilhamento de localização ativado." : "Entrega finalizada.");
      if (status === "out_for_delivery") startLocation(orderId);
      if (status === "delivered") stopLocation();
    } catch (error) { setMessage(error.message); }
  }

  function startLocation(orderId) {
    if (!navigator.geolocation) { setMessage("Este aparelho não oferece suporte à localização."); return; }
    if (!window.isSecureContext && location.hostname !== "localhost") { setMessage("O GPS exige HTTPS. Publique o aplicativo com conexão segura."); return; }
    stopLocation();
    watchId.current = navigator.geolocation.watchPosition(async (position) => {
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      try { await request(`/api/driver/orders/${orderId}/location`, { method: "POST", body: JSON.stringify({ ...coords, accuracy: position.coords.accuracy }) }, session.token); }
      catch (error) { setMessage(error.message); }
    }, (error) => setMessage(`Não foi possível acessar o GPS: ${error.message}`), { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
  }

  function stopLocation() {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }

  function logout() { stopLocation(); setSession(null); setOrders([]); setTracking(null); setScreen("roles"); setMessage(""); }
  function openRole(nextRole) { setRole(nextRole); setMode("login"); setCredentials({ name: "", email: "", password: "" }); setMessage(""); setScreen("auth"); }
  function close() { setScreen("roles"); setMessage(""); setTracking(null); }

  return <>
    <div className="pz-delivery-actions">
      <button className="pz-track-entry" onClick={() => { setScreen("lookup"); setMessage(""); }}>Acompanhar pedido</button>
      <button className="pz-driver-entry" onClick={() => { setScreen(session ? (session.user.role === "admin" ? "admin" : session.user.role === "motoboy" ? "driver" : "customer") : "roles"); setMessage(""); }}>Entrar / Minha conta</button>
    </div>

    {screen && <div className="pz-delivery-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="pz-delivery-modal" role="dialog" aria-modal="true" aria-label="Acesso π-zaria">
        <header className="pz-delivery-head">
          <div><span className="pz-login-kicker">π-ZARIA</span><strong>{screen === "lookup" || screen === "tracking" ? "Acompanhar entrega" : screen === "roles" ? "Bem-vindo" : screen === "auth" ? (mode === "register" ? "Criar conta" : `Entrar — ${roles.find((item) => item.id === role)?.title}`) : screen === "admin" ? "Painel do estabelecimento" : screen === "driver" ? "Área do motoboy" : "Minha conta"}</strong></div>
          <button onClick={close} aria-label="Fechar">Fechar</button>
        </header>
        <div className="pz-delivery-content">
          {message && <div className="pz-delivery-message" role="status">{message}</div>}

          {screen === "roles" && <div className="pz-role-screen">
            <p>Escolha como deseja acessar a π-zaria.</p>
            {roles.map((item) => <button className="pz-role-card" key={item.id} onClick={() => openRole(item.id)}><span className="pz-role-symbol">{item.symbol}</span><span className="pz-role-copy"><strong>{item.title}</strong><small>{item.description}</small></span><span className="pz-role-arrow">›</span></button>)}
            <button className="pz-delivery-secondary pz-role-track" onClick={() => setScreen("lookup")}>Acompanhar pedido sem entrar</button>
          </div>}

          {screen === "auth" && <form onSubmit={signIn} className="pz-delivery-form">
            <p>{role === "cliente" ? "Entre na sua conta ou crie um cadastro para acessar seus pedidos." : role === "motoboy" ? "Acesso exclusivo para entregadores cadastrados pelo estabelecimento." : "Acesso administrativo para gerenciar pedidos e entregadores."}</p>
            {mode === "register" && <><label htmlFor="pz-name">Nome completo</label><input id="pz-name" autoComplete="name" value={credentials.name} onChange={(e) => setCredentials({ ...credentials, name: e.target.value })} required /></>}
            <label htmlFor="pz-email">E-mail</label><input id="pz-email" type="email" autoComplete="username" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} required />
            <label htmlFor="pz-password">Senha</label><input id="pz-password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required />
            <button disabled={busy}>{busy ? "Aguarde..." : mode === "register" ? "Criar minha conta" : "Entrar"}</button>
            {role === "cliente" && <button type="button" className="pz-auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "Ainda não tenho conta — cadastrar" : "Já tenho conta — entrar"}</button>}
            <button type="button" className="pz-auth-back" onClick={() => setScreen("roles")}>Voltar à escolha de acesso</button>
          </form>}

          {screen === "lookup" && <form onSubmit={findTracking} className="pz-delivery-form"><p>Digite o código de acompanhamento recebido após fazer o pedido.</p><label htmlFor="pz-tracking-code">Código do pedido</label><input id="pz-tracking-code" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} placeholder="Ex.: 9F3A..." required /><button disabled={busy}>{busy ? "Consultando..." : "Localizar pedido"}</button></form>}

          {screen === "tracking" && tracking && <div className="pz-tracking-view"><div className="pz-tracking-status"><span>Status</span><strong>{tracking.statusLabel || tracking.status}</strong></div><p>Pedido: <strong>{tracking.trackingCode}</strong></p><p>Destino: {tracking.address || "Endereço não informado"}</p>{tracking.location ? <LiveMap position={{ lat: Number(tracking.location.lat), lng: Number(tracking.location.lng) }} destination={tracking.destination || undefined} destinationAddress={tracking.address || undefined} /> : <div className="pz-map-message">Aguardando o motoboy iniciar a entrega e compartilhar a localização.</div>}<button className="pz-delivery-secondary" onClick={() => setScreen("lookup")}>Consultar outro pedido</button></div>}

          {screen === "customer" && session?.user.role === "cliente" && <div className="pz-driver-panel"><div className="pz-account-welcome"><span className="pz-role-symbol">C</span><div><small>Bem-vindo(a)</small><strong>{session.user.name}</strong><span>{session.user.email}</span></div></div><p>Para acompanhar uma entrega, informe o código recebido após finalizar seu pedido.</p><form className="pz-delivery-form" onSubmit={findTracking}><label htmlFor="pz-customer-code">Código de acompanhamento</label><input id="pz-customer-code" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} placeholder="Código do pedido" required /><button disabled={busy}>{busy ? "Consultando..." : "Acompanhar meu pedido"}</button></form><button className="pz-delivery-secondary pz-logout" onClick={logout}>Sair da conta</button></div>}

          {screen === "admin" && session?.user.role === "admin" && <div className="pz-driver-panel"><div className="pz-driver-welcome">Estabelecimento — <strong>{session.user.name}</strong></div><button className="pz-delivery-secondary" onClick={() => loadAdmin()}>Atualizar pedidos</button>{orders.length === 0 ? <p>Não há pedidos aguardando atribuição.</p> : orders.map((order) => <article className="pz-driver-order" key={order.id}><div><strong>Pedido {order.tracking_code}</strong><span>{order.customer_name}</span><span>{order.address}</span><span>Total: {money(order.total)}</span></div><select aria-label={`Selecionar motoboy do pedido ${order.tracking_code}`} value={order.driver_id || ""} onChange={(e) => e.target.value && assignDriver(order.id, e.target.value)}><option value="" disabled>Escolher motoboy</option>{adminDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></article>)}<button className="pz-delivery-secondary pz-logout" onClick={logout}>Sair</button></div>}

          {screen === "driver" && session?.user.role === "motoboy" && <div className="pz-driver-panel"><div className="pz-driver-welcome">Motoboy conectado — <strong>{session.user.name}</strong></div><button className="pz-delivery-secondary" onClick={() => loadOrders()}>Atualizar entregas</button>{orders.length === 0 ? <p>Não há entregas atribuídas a você neste momento.</p> : orders.map((order) => <article className="pz-driver-order" key={order.id}><div><strong>Pedido {order.tracking_code}</strong><span>{order.customer_name}</span><span>{order.address}</span><span>Total: {money(order.total)}</span></div>{order.status === "assigned" || order.status === "preparing" ? <button onClick={() => updateStatus(order.id, "out_for_delivery")}>Iniciar entrega</button> : order.status === "out_for_delivery" ? <div className="pz-driver-actions"><button onClick={() => startLocation(order.id)}>Retomar GPS</button><button onClick={() => updateStatus(order.id, "delivered")}>Finalizar entrega</button></div> : <span>Concluído</span>}</article>)}<button className="pz-delivery-secondary pz-logout" onClick={logout}>Sair</button></div>}
        </div>
      </section>
    </div>}

    <style>{`
      .pz-delivery-actions{display:flex;gap:8px;align-items:center}.pz-track-entry,.pz-driver-entry{border:1px solid #eee3d9;background:#fff;color:#292522;border-radius:10px;padding:11px 13px;font-weight:700;font-size:13px;cursor:pointer}.pz-driver-entry{background:#292522;color:#fff;border-color:#292522}
      .pz-delivery-backdrop{position:fixed;inset:0;background:rgba(25,20,17,.62);z-index:120;display:grid;place-items:center;padding:16px}.pz-delivery-modal{background:#fff;width:min(560px,100%);max-height:min(91dvh,850px);overflow:auto;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.24)}.pz-delivery-head{position:sticky;top:0;background:#fff;padding:18px 20px;border-bottom:1px solid #eee3d9;display:flex;justify-content:space-between;align-items:center;z-index:2}.pz-delivery-head>div{display:grid;gap:3px}.pz-delivery-head strong{font-size:18px}.pz-login-kicker{font-size:10px;letter-spacing:2px;color:#e83b25;font-weight:800}.pz-delivery-head button,.pz-delivery-secondary{border:1px solid #eee3d9;background:#fff;border-radius:9px;padding:10px 13px;cursor:pointer;font-weight:700}.pz-delivery-content{padding:20px}.pz-delivery-form{display:grid;gap:11px}.pz-delivery-form p,.pz-tracking-view p,.pz-driver-panel p{color:#77716b;line-height:1.6}.pz-delivery-form label{font-weight:700;font-size:13px}.pz-delivery-form input{padding:14px;border:1px solid #e8ded5;border-radius:10px;font:inherit;min-width:0;width:100%;outline-color:#e83b25}.pz-delivery-form>button:not(.pz-auth-switch):not(.pz-auth-back),.pz-driver-order button{background:#e83b25;color:#fff;border:0;border-radius:10px;padding:14px;font-weight:700;cursor:pointer;min-height:46px}.pz-delivery-form button:disabled{opacity:.6}.pz-role-screen>p{color:#77716b;margin:0 0 16px}.pz-role-card{display:flex;align-items:center;gap:13px;width:100%;padding:15px;margin:10px 0;border:1px solid #eee3d9;border-radius:13px;background:#fff;text-align:left;cursor:pointer;transition:border-color .2s,transform .2s}.pz-role-card:hover{border-color:#e83b25;transform:translateY(-1px)}.pz-role-symbol{width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border-radius:12px;background:#fff1eb;color:#d73b25;font-weight:800;font-size:18px}.pz-role-copy{display:grid;gap:4px;flex:1}.pz-role-copy strong{font-size:15px;color:#292522}.pz-role-copy small{font-size:12px;line-height:1.45;color:#77716b}.pz-role-arrow{font-size:25px;color:#a79b91}.pz-role-track{width:100%;margin-top:10px}.pz-auth-switch,.pz-auth-back{border:0;background:transparent;color:#b93321;padding:9px;font-weight:700;cursor:pointer}.pz-auth-back{color:#77716b}.pz-delivery-message{padding:11px 13px;border-radius:9px;background:#fff1e9;color:#a32c1c;margin-bottom:14px;font-size:13px}.pz-tracking-status{display:flex;justify-content:space-between;gap:10px;padding:13px;background:#fff8f2;border-radius:10px}.pz-tracking-status span{color:#77716b}.pz-map-card{margin:16px 0;border:1px solid #eee3d9;border-radius:12px;overflow:hidden}.pz-map-heading{padding:12px 14px;font-weight:700}.pz-live-map{width:100%;height:320px}.pz-map-message{padding:20px;background:#faf7f4;border-radius:10px;color:#6e6259;font-size:13px;line-height:1.6}.pz-driver-welcome{margin-bottom:14px}.pz-driver-order{border:1px solid #eee3d9;border-radius:12px;padding:14px;margin:12px 0;display:flex;gap:14px;justify-content:space-between;align-items:center}.pz-driver-order>div{display:grid;gap:5px;min-width:0}.pz-driver-order span{font-size:13px;color:#77716b;overflow-wrap:anywhere}.pz-driver-order select{max-width:190px;padding:10px;border:1px solid #eee3d9;border-radius:8px;background:white}.pz-driver-actions{display:flex;gap:8px}.pz-driver-actions button{padding:10px}.pz-account-welcome{display:flex;align-items:center;gap:12px;margin-bottom:14px}.pz-account-welcome>div{display:grid;gap:3px}.pz-account-welcome small,.pz-account-welcome span{font-size:12px;color:#77716b}.pz-account-welcome strong{font-size:17px}.pz-logout{width:100%;margin-top:16px}
      @media(max-width:680px){.pz-delivery-actions{gap:5px}.pz-track-entry,.pz-driver-entry{padding:10px 9px;font-size:11px}.pz-delivery-backdrop{padding:8px;align-items:end}.pz-delivery-modal{max-height:95dvh;border-radius:18px 18px 10px 10px}.pz-delivery-content{padding:15px}.pz-live-map{height:270px}.pz-driver-order{align-items:stretch;flex-direction:column}.pz-driver-order select{max-width:none;width:100%}.pz-driver-order button{width:100%;min-height:46px}.pz-driver-actions{flex-direction:column}.pz-role-card{padding:13px}.pz-delivery-head{padding:15px}}
    `}</style>
  </>;
}
