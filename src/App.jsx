import React, { useState, useMemo, useEffect, useRef } from "react";
import WATCHES from "../watches.json";
import { Analytics } from "@vercel/analytics/react";

function formatCurrency(n) {
  const num = Number(n) || 0;
  return `₦${num.toLocaleString()}`;
}

const VENDOR = {
  name: "Samson",
  phoneLocal: "07069761167",
  phoneIntl: "+2347069761167",
  email: "otalorsamson50@gmail.com",
};

// Truncate helper: returns a trimmed string with ellipsis if too long
function truncate(str = "", max = 100) {
  const s = String(str || "");
  if (s.length <= max) return s;
  const sliced = s.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced).trim() + "…";
}

export default function App() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState({});
  const [selected, setSelected] = useState(null);

  const perPage = 9;

  // control truncation lengths here
  const TITLE_MAX = 60; // characters for title shown on cards
  const DESC_MAX = 120; // characters for description shown on cards

  const topRef = useRef(null); // ref to scroll-to when page changes

  // Build PRODUCTS from WATCHES and add ₦5,000 to each price at runtime
  const PRODUCTS = useMemo(
    () =>
      WATCHES.map((p, i) => ({
        id: p.id ?? i + 1,
        title: p.name ?? `Watch ${i + 1}`,
        brand:
          (p.brand && String(p.brand)) ||
          (p.name ? String(p.name).split(" ")[0] : "Brand"),
        // add 5,000 to the base price (runtime only)
        price: (Number(p.price) || 0) + 5000,
        img: p.img || "",
        description: p.description || (p.name ? p.name : ""),
        rating: p.rating || (3 + (i % 3) + (i % 10) * 0.01),
      })),
    [WATCHES]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        String(p.brand).toLowerCase().includes(q)
    );
    list = list.slice();
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [PRODUCTS, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const addToCart = (product) => {
    setCart((c) => {
      const copy = { ...c };
      copy[product.id] = copy[product.id]
        ? { ...copy[product.id], qty: copy[product.id].qty + 1 }
        : { product, qty: 1 };
      return copy;
    });
  };

  const removeFromCart = (id) => {
    setCart((c) => {
      const copy = { ...c };
      delete copy[id];
      return copy;
    });
  };

  const incrementQty = (id) => {
    setCart((c) => {
      const copy = { ...c };
      if (copy[id]) copy[id] = { ...copy[id], qty: copy[id].qty + 1 };
      return copy;
    });
  };

  const decrementQty = (id) => {
    setCart((c) => {
      const copy = { ...c };
      if (!copy[id]) return copy;
      if (copy[id].qty <= 1) {
        delete copy[id];
      } else {
        copy[id] = { ...copy[id], qty: copy[id].qty - 1 };
      }
      return copy;
    });
  };

  const cartCount = Object.values(cart).reduce((s, it) => s + it.qty, 0);
  const cartTotal = Object.values(cart).reduce(
    (s, it) => s + it.qty * Number(it.product.price),
    0
  );

  // build a WhatsApp link with prefilled message summarizing the cart
  const buildWhatsAppLink = () => {
    const lines = [];
    lines.push(`Hello ${VENDOR.name},`);
    lines.push(`I would like to order the following from your store:`);

    Object.values(cart).forEach((it) => {
      const title = it.product.title || it.product.name || "Item";
      const price = Number(it.product.price) || 0;
      lines.push(`- ${title} x ${it.qty} — ${formatCurrency(price)} each`);
    });

    lines.push(`Total: ${formatCurrency(cartTotal)}`);
    lines.push(`Please confirm availability and payment instructions.`);
    lines.push(`Contact email: ${VENDOR.email}`);
    lines.push(`Thanks!`);

    const msg = encodeURIComponent(lines.join("\n"));
    const phone = VENDOR.phoneIntl.replace(/\s+/g, "");
    return `https://wa.me/${phone.replace(/^\+/, "")}?text=${msg}`;
  };

  // close modal on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent background scroll when cart is open (works well on iOS too)
  useEffect(() => {
    if (selected === "cart") {
      const scrollY = window.scrollY || window.pageYOffset;
      document.body.dataset.scrollY = String(scrollY);
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const stored = document.body.dataset.scrollY;
      if (stored !== undefined) {
        const scrollY = parseInt(stored || "0", 10) || 0;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        delete document.body.dataset.scrollY;
      }
    }

    return () => {
      if (document.body.dataset.scrollY !== undefined) {
        const scrollY = parseInt(document.body.dataset.scrollY || "0", 10) || 0;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        delete document.body.dataset.scrollY;
      }
    };
  }, [selected]);

  // Scroll main/topRef into view whenever the page changes
  useEffect(() => {
    const t = setTimeout(() => {
      if (topRef.current && typeof topRef.current.scrollIntoView === "function") {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* ---------- Responsive header ---------- */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="text-xl font-bold">Sammy Fx</div>
              <div className="sm:hidden">
                <button
                  onClick={() => setSelected("cart")}
                  className="relative inline-flex items-center gap-2 px-3 py-1 border rounded-full"
                >
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
              <div className="w-full sm:max-w-lg">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-full border px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Search watches, brands..."
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex flex-col text-sm text-right mr-2">
                <span className="font-medium">Free delivery over ₦50,000</span>
                <span className="text-gray-500">30-day returns</span>
              </div>

              <div className="hidden sm:flex">
                <button
                  onClick={() => setSelected("cart")}
                  className="relative inline-flex items-center gap-2 px-4 py-2 border rounded-full"
                >
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* ---------- end header ---------- */}

      <main ref={topRef} className="max-w-7xl mx-auto px-4 py-8 text-left">
        <section className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Watches</h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="popular">Popular</option>
              <option value="low">Price: Low → High</option>
              <option value="high">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((p) => (
              <article
                key={p.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden text-left"
              >
                <div className="relative">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-56 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 bg-white/80 px-3 py-1 rounded-full text-sm font-medium">
                    {p.brand}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="pr-4">
                      <h3 className="font-semibold">{truncate(p.title, TITLE_MAX)}</h3>
                      <p className="text-sm text-gray-500 min-h-[56px]">
                        {truncate(p.description, DESC_MAX)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(p.price)}</div>
                      <div className="text-xs text-gray-500">⭐ {p.rating}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addToCart(p)}
                      className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:opacity-95"
                    >
                      Add to cart
                    </button>
                    <button
                      onClick={() => setSelected(p)}
                      className="px-3 py-2 rounded-lg border text-sm"
                    >
                      Quick view
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-lg border"
              disabled={currentPage === 1}
            >
              Prev
            </button>

            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 rounded ${
                    currentPage === i + 1 ? "bg-indigo-600 text-white" : "border"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 rounded-lg border"
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </section>
      </main>

      {/* ---------------- Responsive Cart & Quick View ---------------- */}
      {/* Desktop/tablet overlay for quick view */}
      {selected && selected !== "cart" && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-2xl font-bold">{selected.title}</h3>
              <p className="text-gray-600 mt-2">{selected.description}</p>
              <div className="mt-4">
                <img
                  src={selected.img}
                  alt={selected.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(selected.price)}</div>
                <div className="text-sm text-gray-500">⭐ {selected.rating}</div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    addToCart(selected);
                    setSelected(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                >
                  Add to cart
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART: Mobile bottom sheet */}
      {selected === "cart" && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
            <div className="bg-black/30 fixed inset-0" onClick={() => setSelected(null)} />
            <div
              className="relative bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-auto p-4"
              style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Your cart ({cartCount})</h3>
                <button onClick={() => setSelected(null)} className="px-3 py-1 rounded border">
                  Close
                </button>
              </div>

              {Object.keys(cart).length === 0 ? (
                <p className="text-gray-500">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {Object.values(cart).map((it) => (
                    <div key={it.product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.product.img}
                          alt={it.product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{truncate(it.product.title, TITLE_MAX)}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(it.product.price)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrementQty(it.product.id)}
                          className="px-2 py-1 rounded border"
                        >
                          −
                        </button>
                        <div className="text-sm">{it.qty}</div>
                        <button
                          onClick={() => incrementQty(it.product.id)}
                          className="px-2 py-1 rounded border"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div className="font-semibold">Total</div>
                    <div className="font-bold">{formatCurrency(cartTotal)}</div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <a
                      href={buildWhatsAppLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-center"
                    >
                      Finish Up
                    </a>

                    <a
                      href={`mailto:${VENDOR.email}?subject=${encodeURIComponent("Order enquiry")}&body=${encodeURIComponent(
                        `Hello ${VENDOR.name},\n\nI want to order the following items:\n\nTotal: ${formatCurrency(cartTotal)}\n\nPlease get back to me with payment/availability details.\n\nThanks.`
                      )}`}
                      className="px-4 py-2 rounded-lg border text-center"
                    >
                      Email Vendor
                    </a>
                  </div>

                  <div className="text-sm text-gray-600 mt-3">
                    <div>Vendor: {VENDOR.name}</div>
                    <div>WhatsApp: {VENDOR.phoneLocal} ({VENDOR.phoneIntl})</div>
                    <div>
                      Email:{" "}
                      <a className="text-indigo-600 underline" href={`mailto:${VENDOR.email}`}>
                        {VENDOR.email}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop / Tablet drawer (visible on sm+) */}
          <div
            className="fixed inset-0 hidden sm:flex z-40 items-stretch justify-end"
            onClick={() => setSelected(null)}
          >
            <div className="flex-1 bg-black/40" />
            <div
              className="w-full sm:w-96 bg-white shadow-xl overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Your cart ({cartCount})</h3>
                <button onClick={() => setSelected(null)} className="px-3 py-1 rounded border">
                  Close
                </button>
              </div>

              <div className="p-4">
                {Object.keys(cart).length === 0 ? (
                  <p className="text-gray-500">Cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {Object.values(cart).map((it) => (
                      <div key={it.product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.product.img}
                            alt={it.product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{truncate(it.product.title, TITLE_MAX)}</div>
                            <div className="text-sm text-gray-500">{formatCurrency(it.product.price)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decrementQty(it.product.id)}
                            className="px-2 py-1 rounded border"
                          >
                            −
                          </button>
                          <div className="text-sm">{it.qty}</div>
                          <button
                            onClick={() => incrementQty(it.product.id)}
                            className="px-2 py-1 rounded border"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t flex items-center justify-between">
                      <div className="font-semibold">Total</div>
                      <div className="font-bold">{formatCurrency(cartTotal)}</div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      <a
                        href={buildWhatsAppLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-center"
                      >
                        Finish Up
                      </a>

                      <a
                        href={`mailto:${VENDOR.email}?subject=${encodeURIComponent("Order enquiry")}&body=${encodeURIComponent(
                          `Hello ${VENDOR.name},\n\nI want to order the following items:\n\nTotal: ${formatCurrency(cartTotal)}\n\nPlease get back to me with payment/availability details.\n\nThanks.`
                        )}`}
                        className="px-4 py-2 rounded-lg border text-center"
                      >
                        Email Vendor
                      </a>
                    </div>

                    <div className="text-sm text-gray-600 mt-3">
                      <div>Vendor: {VENDOR.name}</div>
                      <div>WhatsApp: {VENDOR.phoneLocal} ({VENDOR.phoneIntl})</div>
                      <div>
                        Email:{" "}
                        <a className="text-indigo-600 underline" href={`mailto:${VENDOR.email}`}>
                          {VENDOR.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <footer className="border-t mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
          <div>
            done by{" "}
            <a className="font-bold text-blue-500" href="https://www.josephbawo.tech/">
              josephbawo
            </a>
          </div>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}
