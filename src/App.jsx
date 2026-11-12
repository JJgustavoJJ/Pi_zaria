
import React, { useMemo, useState } from "react";
import "./App.css";
import DeliveryAccess from "./DeliveryAccess";

const pizzas = [
  {
    id: 1,
    name: "Calabresa",
    category: "Tradicionais",
    description: "Molho de tomate, muçarela, calabresa e cebola-roxa.",
    price: 39.9,
    image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85",
    tag: "Mais pedida",
  },
  {
    id: 2,
    name: "Quatro queijos",
    category: "Especiais",
    description: "Muçarela, provolone, parmesão e gorgonzola.",
    price: 46.9,
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 3,
    name: "Frango com catupiry",
    category: "Tradicionais",
    description: "Frango temperado, muçarela e catupiry cremoso.",
    price: 44.9,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 4,
    name: "Portuguesa",
    category: "Especiais",
    description: "Presunto, ovo, cebola, azeitona e muçarela.",
    price: 45.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 5,
    name: "Margherita",
    category: "Vegetarianas",
    description: "Muçarela, tomate fresco, manjericão e azeite.",
    price: 41.9,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 6,
    name: "Pepperoni",
    category: "Especiais",
    description: "Muçarela, molho da casa e pepperoni.",
    price: 48.9,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1000&q=85",
  },
];

const drinks = [
  {
    id: 101,
    name: "Refrigerante 2 L",
    description: "Consulte os sabores disponíveis.",
    price: 12.9,
  },
  {
    id: 102,
    name: "Refrigerante lata",
    description: "Lata de 350 ml.",
    price: 6.5,
  },
  {
    id: 103,
    name: "Água mineral",
    description: "Com ou sem gás, 500 ml.",
    price: 4.5,
  },
];

const money = (value) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function App() {
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [payment, setPayment] = useState("Pix");
  const [orderType, setOrderType] = useState("Entrega");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const filteredPizzas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return pizzas.filter((pizza) => {
      const matchesCategory =
        category === "Todas" || pizza.category === category;

      const matchesSearch =
        pizza.name.toLowerCase().includes(term) ||
        pizza.description.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const count = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee =
    orderType === "Entrega" && cart.length > 0 ? 5 : 0;

  const total = subtotal + deliveryFee;

  function showNotice(message) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2500);
  }

  function addItem(product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    showNotice(`${product.name} adicionado à sacola.`);
  }

  function changeQuantity(id, delta) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCart() {
    setCartOpen(true);
    setCheckoutOpen(false);
  }

  function openCheckout() {
    if (cart.length === 0) {
      showNotice("Adicione produtos antes de continuar.");
      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function finishOrder(event) {
    event.preventDefault();

    if (cart.length === 0) {
      showNotice("Sua sacola está vazia.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      (orderType === "Entrega" && !form.address.trim())
    ) {
      showNotice("Preencha todos os campos obrigatórios.");
      return;
    }

    const summary = cart
      .map(
        (item) =>
          `${item.quantity}x ${item.name} - ${money(
            item.price * item.quantity
          )}`
      )
      .join("\n");

    const message = [
      "PEDIDO - PI-ZARIA",
      "",
      `Cliente: ${form.name}`,
      `Telefone: ${form.phone}`,
      orderType === "Entrega"
        ? `Endereço: ${form.address}`
        : "Retirada no local",
      `Pagamento: ${payment}`,
      "",
      "PRODUTOS:",
      summary,
      "",
      `Subtotal: ${money(subtotal)}`,
      `Entrega: ${money(deliveryFee)}`,
      `Total: ${money(total)}`,
      form.notes ? `Observações: ${form.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    console.info(message);

    showNotice(
      "Pedido organizado. Esta versão ainda não envia pedidos."
    );

    setCart([]);
    setCheckoutOpen(false);
    setForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
    });
  }

  return (
    <div className="pz-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

        :root {
          --pz-red: #e83b25;
          --pz-red-dark: #c92e1c;
          --pz-ink: #292522;
          --pz-muted: #77716b;
          --pz-cream: #fff9f3;
          --pz-line: #eee3d9;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: 'DM Sans', sans-serif;
          color: var(--pz-ink);
        }

        button, input, textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .pz-app {
          min-height: 100vh;
          background: #fff;
        }

        .pz-wrap {
          width: min(1180px, calc(100% - 48px));
          margin: auto;
        }

        .pz-header {
          height: 76px;
          background: #fff;
          border-bottom: 1px solid var(--pz-line);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .pz-header-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .pz-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--pz-ink);
          font-family: Manrope, sans-serif;
          font-size: 23px;
          font-weight: 800;
        }

        .pz-brand b {
          color: var(--pz-red);
        }

        .pz-brand-mark {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          background: var(--pz-red);
          color: white;
          border-radius: 12px;
          font-size: 25px;
        }

        .pz-nav {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .pz-nav a {
          color: var(--pz-ink);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .pz-nav a:hover {
          color: var(--pz-red);
        }

        .pz-cart-button,
        .pz-primary {
          background: var(--pz-red);
          color: white;
          border: 0;
          border-radius: 11px;
          padding: 14px 19px;
          font-weight: 700;
        }

        .pz-cart-button span {
          margin-left: 7px;
        }

        .pz-cart-button:hover,
        .pz-primary:hover {
          background: var(--pz-red-dark);
        }

        .pz-menu-toggle {
          display: none;
          padding: 10px;
          background: white;
          border: 1px solid var(--pz-line);
          border-radius: 8px;
        }

        .pz-hero {
          background: linear-gradient(110deg, #fff1e2, #ffe4d6);
        }

        .pz-hero-inner {
          min-height: 570px;
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          align-items: center;
          gap: 45px;
          padding: 50px 0;
        }

        .pz-eyebrow {
          display: inline-block;
          background: white;
          border: 1px solid #f3d8c4;
          color: var(--pz-red);
          padding: 11px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .pz-hero h1 {
          font-family: Manrope, sans-serif;
          font-size: clamp(42px, 5.2vw, 70px);
          line-height: 1.12;
          letter-spacing: -3px;
          margin: 27px 0 20px;
        }

        .pz-hero h1 em {
          color: var(--pz-red);
          font-style: normal;
        }

        .pz-hero-copy {
          color: #6e6259;
          font-size: 17px;
          line-height: 1.8;
          max-width: 550px;
        }

        .pz-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .pz-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: var(--pz-ink);
          border: 1px solid #ead7c9;
          border-radius: 11px;
          padding: 14px 19px;
          text-decoration: none;
          font-weight: 700;
        }

        .pz-hero-art {
          min-height: 390px;
          display: grid;
          place-items: center;
          position: relative;
        }

        .pz-pizza-frame {
          width: min(360px, 80vw);
          aspect-ratio: 1;
          border-radius: 50%;
          background: #e9a34d;
          border: 14px solid white;
          box-shadow: inset 0 0 0 12px #c77c32;
          display: grid;
          place-items: center;
        }

        .pz-pizza-frame img {
          width: 78%;
          height: 78%;
          object-fit: cover;
          border-radius: 50%;
        }

        .pz-note {
          position: absolute;
          background: white;
          padding: 15px 19px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,.07);
          font-size: 13px;
          font-weight: 700;
        }

        .pz-note-one {
          top: 70px;
          left: 0;
        }

        .pz-note-two {
          bottom: 70px;
          right: 0;
        }

        .pz-trust {
          background: #fffaf5;
          border-bottom: 1px solid var(--pz-line);
        }

        .pz-trust-inner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 25px 0;
        }

        .pz-trust-item {
          text-align: center;
          color: #6b625b;
          font-size: 13px;
        }

        .pz-section {
          padding: 85px 0;
        }

        .pz-section-head {
          margin-bottom: 30px;
        }

        .pz-kicker {
          color: var(--pz-red);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .pz-section h2 {
          font-family: Manrope, sans-serif;
          font-size: clamp(30px, 3.3vw, 42px);
          margin: 10px 0;
          letter-spacing: -1px;
        }

        .pz-section-sub {
          color: var(--pz-muted);
          line-height: 1.7;
        }

        .pz-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .pz-search {
          width: 300px;
          max-width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--pz-line);
          border-radius: 9px;
          outline: none;
        }

        .pz-search:focus,
        .pz-field:focus {
          border-color: var(--pz-red);
        }

        .pz-categories {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pz-chip {
          padding: 11px 15px;
          border: 1px solid var(--pz-line);
          background: white;
          border-radius: 30px;
          color: #615850;
          font-size: 13px;
          font-weight: 700;
        }

        .pz-chip.active {
          background: var(--pz-red);
          color: white;
          border-color: var(--pz-red);
        }

        .pz-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .pz-product {
          border: 1px solid var(--pz-line);
          border-radius: 15px;
          overflow: hidden;
          background: white;
          transition: .2s;
        }

        .pz-product:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(0,0,0,.07);
        }

        .pz-product-image {
          height: 220px;
          position: relative;
          background: #f8eee5;
        }

        .pz-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pz-tag {
          position: absolute;
          top: 13px;
          left: 13px;
          padding: 7px 10px;
          background: white;
          color: var(--pz-red);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .pz-product-body {
          padding: 19px;
        }

        .pz-product-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .pz-product h3 {
          margin: 0;
          font-family: Manrope, sans-serif;
          font-size: 18px;
        }

        .pz-price {
          color: var(--pz-red);
          font-weight: 800;
          white-space: nowrap;
        }

        .pz-product p {
          color: var(--pz-muted);
          font-size: 13px;
          line-height: 1.7;
          min-height: 44px;
        }

        .pz-product-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pz-category-label {
          color: #8b8178;
          font-size: 11px;
          text-transform: uppercase;
        }

        .pz-add {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 9px;
          background: #fff0e8;
          color: var(--pz-red);
          font-size: 23px;
        }

        .pz-add:hover {
          background: var(--pz-red);
          color: white;
        }

        .pz-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 45px;
          color: var(--pz-muted);
        }

        .pz-about {
          background: var(--pz-cream);
        }

        .pz-about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 60px;
        }

        .pz-about-photo {
          height: 390px;
          border-radius: 18px;
          overflow: hidden;
        }

        .pz-about-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pz-about-copy p {
          color: var(--pz-muted);
          line-height: 1.9;
        }

        .pz-about-points {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .pz-about-point {
          padding: 16px;
          background: white;
          border: 1px solid var(--pz-line);
          border-radius: 10px;
        }

        .pz-about-point strong {
          display: block;
          margin-bottom: 6px;
        }

        .pz-about-point span {
          color: var(--pz-muted);
          font-size: 12px;
        }

        .pz-footer {
          background: #292522;
          color: white;
          padding: 40px 0;
        }

        .pz-footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 25px;
        }

        .pz-footer p {
          color: #c5bcb5;
          font-size: 12px;
        }

        .pz-footer-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .pz-footer-links a {
          color: #eee4dc;
          text-decoration: none;
          font-size: 13px;
        }

        .pz-overlay {
          position: fixed;
          inset: 0;
          background: rgba(35,28,24,.45);
          z-index: 50;
          display: flex;
          justify-content: flex-end;
        }

        .pz-drawer {
          height: 100%;
          width: min(470px, 100%);
          background: white;
          display: flex;
          flex-direction: column;
        }

        .pz-drawer-head {
          padding: 22px 24px;
          border-bottom: 1px solid var(--pz-line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pz-drawer-head h2 {
          margin: 0;
          font-family: Manrope, sans-serif;
        }

        .pz-close {
          background: white;
          border: 1px solid var(--pz-line);
          border-radius: 8px;
          padding: 8px 12px;
        }

        .pz-cart-items {
          flex: 1;
          padding: 18px 24px;
          overflow-y: auto;
        }

        .pz-cart-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 0;
          border-bottom: 1px solid var(--pz-line);
        }

        .pz-cart-row h3 {
          margin: 0 0 6px;
          font-size: 15px;
        }

        .pz-cart-row p {
          color: var(--pz-muted);
          font-size: 13px;
        }

        .pz-quantity {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .pz-quantity button {
          width: 28px;
          height: 28px;
          border: 1px solid var(--pz-line);
          background: white;
          border-radius: 7px;
        }

        .pz-cart-foot {
          padding: 22px 24px;
          border-top: 1px solid var(--pz-line);
        }

        .pz-total-line {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          color: #655d56;
          font-size: 14px;
        }

        .pz-total-line.final {
          color: var(--pz-ink);
          font-size: 19px;
          font-weight: 800;
          margin: 17px 0;
        }

        .pz-full {
          width: 100%;
        }

        .pz-cart-empty {
          text-align: center;
          padding: 55px 15px;
          color: var(--pz-muted);
          line-height: 1.7;
        }

        .pz-checkout {
          padding: 22px 24px;
          overflow-y: auto;
        }

        .pz-field-group {
          margin-bottom: 17px;
        }

        .pz-field-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .pz-field {
          width: 100%;
          border: 1px solid var(--pz-line);
          border-radius: 9px;
          padding: 12px;
          outline: none;
        }

        .pz-choice-row {
          display: flex;
          gap: 9px;
        }

        .pz-choice {
          flex: 1;
          padding: 12px;
          border: 1px solid var(--pz-line);
          background: white;
          border-radius: 9px;
          font-weight: 700;
        }

        .pz-choice.selected {
          border-color: var(--pz-red);
          background: #fff2ec;
          color: var(--pz-red);
        }

        .pz-notice {
          position: fixed;
          z-index: 80;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #292522;
          color: white;
          padding: 14px 20px;
          border-radius: 9px;
          font-size: 13px;
          text-align: center;
          max-width: calc(100% - 32px);
        }

        @media(max-width: 900px) {
          .pz-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pz-hero-inner {
            gap: 20px;
          }
        }

        @media(max-width: 680px) {
          .pz-wrap {
            width: calc(100% - 32px);
          }

          .pz-header {
            height: 68px;
          }

          .pz-menu-toggle {
            display: block;
          }

          .pz-nav {
            display: none;
            position: absolute;
            top: 65px;
            left: 16px;
            right: 16px;
            padding: 15px;
            background: white;
            border: 1px solid var(--pz-line);
            border-radius: 12px;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
          }

          .pz-nav.open {
            display: flex;
          }

          .pz-nav a {
            padding: 12px 4px;
          }

          .pz-brand {
            font-size: 19px;
          }

          .pz-cart-button {
            padding: 11px 12px;
            font-size: 12px;
          }

          .pz-hero-inner {
            grid-template-columns: 1fr;
            padding: 42px 0 35px;
          }

          .pz-hero h1 {
            font-size: clamp(40px, 11vw, 56px);
            letter-spacing: -2px;
          }

          .pz-hero-copy {
            font-size: 15px;
          }

          .pz-hero-art {
            min-height: 280px;
          }

          .pz-pizza-frame {
            width: 245px;
          }

          .pz-note {
            font-size: 11px;
            padding: 12px;
          }

          .pz-trust-inner {
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .pz-trust-item {
            text-align: left;
          }

          .pz-section {
            padding: 60px 0;
          }

          .pz-controls {
            flex-direction: column;
          }

          .pz-search {
            width: 100%;
          }

          .pz-categories {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 5px;
          }

          .pz-chip {
            white-space: nowrap;
          }

          .pz-grid {
            grid-template-columns: 1fr;
          }

          .pz-product-image {
            height: 230px;
          }

          .pz-about-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .pz-about-photo {
            height: 270px;
          }

          .pz-footer-inner {
            align-items: flex-start;
            flex-direction: column;
          }

          .pz-hero-actions > * {
            flex: 1;
          }
        }
      `}</style>

      <header className="pz-header">
        <div className="pz-wrap pz-header-inner">
          <a className="pz-brand" href="#inicio">
            <span className="pz-brand-mark">π</span>
            <span>π <b>-zzaria</b></span>
          </a>

          <button
            className="pz-menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
          >
            Menu
          </button>

          <nav className={`pz-nav ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
            <a href="#inicio">Início</a>
            <a href="#cardapio">Cardápio</a>
            <a href="#sobre">Sobre nós</a>
            <a href="#contato">Contato</a>
          </nav>

          <DeliveryAccess />

          <button className="pz-cart-button" onClick={openCart}>
            Sacola <span>({count})</span>
          </button>
        </div>
      </header>

      <main>
        <section className="pz-hero" id="inicio">
          <div className="pz-wrap pz-hero-inner">
            <div>
              <span className="pz-eyebrow">
                SUA PIZZARIA FAVORITA
              </span>

              <h1>
                Uma fatia de felicidade em cada <em>pedaço.</em>
              </h1>

              <p className="pz-hero-copy">
                Na π-zaria, você escolhe os sabores,
                personaliza sua pizza e acompanha seu pedido.
                Tudo de um jeito simples e delicioso.
              </p>

              <div className="pz-hero-actions">
                <a href="#cardapio" className="pz-primary">
                  Explorar cardápio
                </a>

                <a href="#sobre" className="pz-secondary">
                  Conheça a π-zaria
                </a>
              </div>
            </div>

            <div className="pz-hero-art">
              <div className="pz-pizza-frame">
                <img
                  src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=85"
                  alt="Pizza preparada pela π-zaria"
                />
              </div>

              <div className="pz-note pz-note-one">
                Qualidade em cada detalhe
              </div>

              <div className="pz-note pz-note-two">
                Preparada para você
              </div>
            </div>
          </div>
        </section>

        <section className="pz-trust">
          <div className="pz-wrap pz-trust-inner">
            <div className="pz-trust-item">
              Ingredientes selecionados
            </div>

            <div className="pz-trust-item">
              Preparação cuidadosa
            </div>

            <div className="pz-trust-item">
              Sabor em cada pedido
            </div>
          </div>
        </section>

        <section className="pz-section" id="cardapio">
          <div className="pz-wrap">
            <div className="pz-section-head">
              <span className="pz-kicker">NOSSO CARDÁPIO</span>
              <h2>Escolha sua próxima pizza.</h2>
              <p className="pz-section-sub">
                Sabores preparados com ingredientes selecionados
                para tornar seu pedido especial.
              </p>
            </div>

            <div className="pz-controls">
              <input
                className="pz-search"
                type="search"
                placeholder="Pesquisar no cardápio..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="pz-categories">
                {["Todas", "Tradicionais", "Especiais", "Vegetarianas"].map(
                  (item) => (
                    <button
                      key={item}
                      className={`pz-chip ${
                        category === item ? "active" : ""
                      }`}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="pz-grid">
              {filteredPizzas.length > 0 ? (
                filteredPizzas.map((pizza) => (
                  <article className="pz-product" key={pizza.id}>
                    <div className="pz-product-image">
                      <img src={pizza.image} alt={pizza.name} />

                      {pizza.tag && (
                        <span className="pz-tag">{pizza.tag}</span>
                      )}
                    </div>

                    <div className="pz-product-body">
                      <div className="pz-product-top">
                        <h3>{pizza.name}</h3>
                        <span className="pz-price">
                          {money(pizza.price)}
                        </span>
                      </div>

                      <p>{pizza.description}</p>

                      <div className="pz-product-bottom">
                        <span className="pz-category-label">
                          {pizza.category}
                        </span>

                        <button
                          className="pz-add"
                          onClick={() => addItem(pizza)}
                          aria-label={`Adicionar ${pizza.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="pz-empty">
                  Nenhuma pizza encontrada.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pz-section" id="bebidas">
          <div className="pz-wrap">
            <div className="pz-section-head">
              <span className="pz-kicker">PARA ACOMPANHAR</span>
              <h2>Bebidas</h2>
              <p className="pz-section-sub">
                Complete seu pedido com uma bebida.
              </p>
            </div>

            <div className="pz-grid">
              {drinks.map((drink) => (
                <article className="pz-product" key={drink.id}>
                  <div className="pz-product-body">
                    <div className="pz-product-top">
                      <h3>{drink.name}</h3>
                      <span className="pz-price">
                        {money(drink.price)}
                      </span>
                    </div>

                    <p>{drink.description}</p>

                    <div className="pz-product-bottom">
                      <span className="pz-category-label">
                        Bebidas
                      </span>

                      <button
                        className="pz-add"
                        onClick={() => addItem(drink)}
                        aria-label={`Adicionar ${drink.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pz-section pz-about" id="sobre">
          <div className="pz-wrap pz-about-grid">
            <div className="pz-about-photo">
              <img
                src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85"
                alt="Pizza artesanal"
              />
            </div>

            <div className="pz-about-copy">
              <span className="pz-kicker">SOBRE NÓS</span>

              <h2>Mais que uma pizza, uma boa experiência.</h2>

              <p>
                A π-zaria nasceu com a proposta de oferecer pizzas
                saborosas, preparadas com atenção aos detalhes e
                ingredientes de qualidade.
              </p>

              <p>
                Nosso objetivo é tornar cada pedido simples,
                prático e especial, desde a escolha do sabor
                até o momento de receber sua pizza.
              </p>

              <div className="pz-about-points">
                <div className="pz-about-point">
                  <strong>Qualidade</strong>
                  <span>Ingredientes selecionados.</span>
                </div>

                <div className="pz-about-point">
                  <strong>Praticidade</strong>
                  <span>Pedido simples e rápido.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pz-footer" id="contato">
        <div className="pz-wrap pz-footer-inner">
          <div>
            <a className="pz-brand" href="#inicio">
              <span className="pz-brand-mark">π</span>
              <span>π <b>-zzaria</b></span>
            </a>

            <p>
              Uma boa pizza faz parte dos bons momentos.
            </p>

            <p>
              © {new Date().getFullYear()} π-zaria.
              Todos os direitos reservados.
            </p>
          </div>

          <div className="pz-footer-links">
            <a href="#inicio">Início</a>
            <a href="#cardapio">Cardápio</a>
            <a href="#bebidas">Bebidas</a>
            <a href="#sobre">Sobre nós</a>
          </div>
        </div>
      </footer>

      {cartOpen && (
        <div
          className="pz-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false);
            }
          }}
        >
          <aside className="pz-drawer">
            <div className="pz-drawer-head">
              <h2>Sua sacola ({count})</h2>

              <button
                className="pz-close"
                onClick={() => setCartOpen(false)}
                aria-label="Fechar sacola"
              >
                Fechar
              </button>
            </div>

            <div className="pz-cart-items">
              {cart.length === 0 ? (
                <div className="pz-cart-empty">
                  <h3>Sua sacola está vazia.</h3>
                  <p>Escolha seus produtos no cardápio.</p>

                  <button
                    className="pz-primary"
                    onClick={() => {
                      setCartOpen(false);
                      document
                        .getElementById("cardapio")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Ver cardápio
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div className="pz-cart-row" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>

                      <p>{money(item.price)} por unidade</p>

                      <div className="pz-quantity">
                        <button
                          onClick={() => changeQuantity(item.id, -1)}
                          aria-label={`Diminuir ${item.name}`}
                        >
                          -
                        </button>

                        <strong>{item.quantity}</strong>

                        <button
                          onClick={() => changeQuantity(item.id, 1)}
                          aria-label={`Aumentar ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <strong>
                      {money(item.price * item.quantity)}
                    </strong>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pz-cart-foot">
                <div className="pz-total-line">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <div className="pz-total-line">
                  <span>Entrega</span>
                  <strong>{money(deliveryFee)}</strong>
                </div>

                <div className="pz-total-line final">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>

                <button
                  className="pz-primary pz-full"
                  onClick={openCheckout}
                >
                  Continuar pedido
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="pz-overlay">
          <aside className="pz-drawer">
            <div className="pz-drawer-head">
              <h2>Finalizar pedido</h2>

              <button
                className="pz-close"
                onClick={() => setCheckoutOpen(false)}
              >
                Fechar
              </button>
            </div>

            <form className="pz-checkout" onSubmit={finishOrder}>
              <div className="pz-field-group">
                <label htmlFor="name">Nome completo *</label>
                <input
                  className="pz-field"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="pz-field-group">
                <label htmlFor="phone">Telefone *</label>
                <input
                  className="pz-field"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={updateForm}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="pz-field-group">
                <label>Tipo de pedido</label>

                <div className="pz-choice-row">
                  {["Entrega", "Retirada"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      className={`pz-choice ${
                        orderType === type ? "selected" : ""
                      }`}
                      onClick={() => setOrderType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {orderType === "Entrega" && (
                <div className="pz-field-group">
                  <label htmlFor="address">Endereço completo *</label>
                  <input
                    className="pz-field"
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={updateForm}
                    placeholder="Rua, número, bairro e complemento"
                    required
                  />
                </div>
              )}

              <div className="pz-field-group">
                <label>Forma de pagamento</label>

                <div className="pz-choice-row">
                  {["Pix", "Dinheiro", "Cartão"].map((method) => (
                    <button
                      type="button"
                      key={method}
                      className={`pz-choice ${
                        payment === method ? "selected" : ""
                      }`}
                      onClick={() => setPayment(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pz-field-group">
                <label htmlFor="notes">Observações</label>
                <textarea
                  className="pz-field"
                  id="notes"
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={updateForm}
                  placeholder="Alguma informação adicional?"
                />
              </div>

              <div className="pz-cart-foot">
                <div className="pz-total-line">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <div className="pz-total-line">
                  <span>Entrega</span>
                  <strong>{money(deliveryFee)}</strong>
                </div>

                <div className="pz-total-line final">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>

                <button
                  className="pz-primary pz-full"
                  type="submit"
                >
                  Confirmar pedido
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {notice && (
        <div className="pz-notice" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
