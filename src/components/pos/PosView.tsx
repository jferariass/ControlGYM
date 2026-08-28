import React, { useState, useEffect } from 'react';
import type { Product, ProductCategory, PaymentMethod, Member, User } from '../../types';
import { db } from '../../services/db';
import { ShoppingCart, Package, Plus, Trash2, Edit, CheckCircle2, Search, RefreshCw, X, Image as ImageIcon, Barcode, Upload } from 'lucide-react';

interface PosViewProps {
  currentUser: User;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosView: React.FC<PosViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'stock'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isAccountCharge, setIsAccountCharge] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter state
  const [searchProduct, setSearchProduct] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ProductCategory>('ALL');

  // Stock Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    barCode: '',
    description: '',
    category: 'BEBIDAS' as ProductCategory,
    price: 1500,
    costPrice: 800,
    stock: 20,
    minStock: 5,
    imageUrl: '',
  });

  // Re-stock Modal State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(db.getProducts());
    setMembers(db.getMembers());
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Sin stock disponible de ${product.name}`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No podés agregar más de ${product.stock} unidades en stock.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Máximo en stock: ${item.product.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let member: Member | null = null;
    if (selectedMemberId) {
      member = members.find(m => m.id === selectedMemberId) || null;
    }

    if (isAccountCharge && !member) {
      alert('Para fiar / cargar a la cuenta, seleccioná un socio.');
      return;
    }

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.product.price * item.quantity,
    }));

    db.createProductSale({
      items: saleItems,
      totalAmount: cartTotal,
      paymentMethod: isAccountCharge ? 'EFECTIVO' : paymentMethod,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      memberId: member ? member.id : undefined,
      memberName: member ? `${member.firstName} ${member.lastName}` : undefined,
      isAccountCharge,
    });

    loadData();
    setCart([]);
    setSelectedMemberId('');
    setIsAccountCharge(false);

    setNotification({
      message: isAccountCharge
        ? `¡Venta cargada a la cuenta de ${member?.firstName} ${member?.lastName}!`
        : '¡Venta de cantina registrada correctamente!',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Product CRUD
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      barCode: '',
      description: '',
      category: 'BEBIDAS',
      price: 1500,
      costPrice: 800,
      stock: 20,
      minStock: 5,
      imageUrl: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      barCode: prod.barCode || '',
      description: prod.description || '',
      category: prod.category,
      price: prod.price,
      costPrice: prod.costPrice,
      stock: prod.stock,
      minStock: prod.minStock,
      imageUrl: prod.imageUrl || '',
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProductForm(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || productForm.price <= 0) return;

    db.saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      name: productForm.name.trim(),
      barCode: productForm.barCode.trim(),
      description: productForm.description.trim(),
      category: productForm.category,
      price: Number(productForm.price),
      costPrice: Number(productForm.costPrice),
      stock: Number(productForm.stock),
      minStock: Number(productForm.minStock),
      imageUrl: productForm.imageUrl,
    });

    loadData();
    setIsProductModalOpen(false);
    setNotification({
      message: editingProduct ? 'Producto actualizado correctamente.' : 'Nuevo producto agregado.',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Solo el Dueño / Administrador puede eliminar productos.');
      return;
    }
    if (confirm(`¿Eliminar producto "${name}"?`)) {
      db.deleteProduct(id);
      loadData();
    }
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || restockQty <= 0) return;

    db.updateProductStock(restockProduct.id, Number(restockQty));
    loadData();
    setRestockProduct(null);
    setNotification({
      message: `¡Stock actualizado de ${restockProduct.name} (+${restockQty} unidades)!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const query = searchProduct.toLowerCase().trim();
    const matchesName = p.name.toLowerCase().includes(query);
    const matchesCode = (p.barCode || '').toLowerCase().includes(query);
    const matchesSearch = matchesName || matchesCode;
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header with Prominent "+ Agregar Producto" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            Cantina & Control de Stock
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Venta rápida de bebidas, suplementos y ropa.</p>
        </div>

        <button
          onClick={handleOpenNewProduct}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Agregar Producto
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-md ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-xs sm:text-sm">{notification.message}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'pos'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Venta Rápida (Cantina)
        </button>

        <button
          onClick={() => setActiveSubTab('stock')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'stock'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Inventario & Stock ({products.length})
        </button>
      </div>

      {/* Subtab 1: POS / Cantina */}
      {activeSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search & Categories */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                  placeholder="Buscar por Nombre o Código de Barras..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['ALL', 'BEBIDAS', 'SUPLEMENTOS', 'INDUMENTARIA', 'ACCESORIOS'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map(prod => (
                <button
                  key={prod.id}
                  onClick={() => handleAddToCart(prod)}
                  disabled={prod.stock <= 0}
                  className={`bg-slate-900 border p-3 rounded-2xl text-left space-y-2 transition flex flex-col justify-between hover:border-emerald-400/60 active:scale-95 ${
                    prod.stock <= 0
                      ? 'border-slate-800 opacity-50 cursor-not-allowed'
                      : prod.stock <= prod.minStock
                      ? 'border-amber-500/40 shadow-sm'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Product Image Thumbnail */}
                  <div className="w-full h-24 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 relative">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-700" />
                    )}
                    {prod.barCode && (
                      <span className="absolute bottom-1 right-1 bg-slate-900/90 text-slate-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <Barcode className="w-2.5 h-2.5" />
                        {prod.barCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {prod.category}
                    </span>
                    <h4 className="font-extrabold text-white text-xs leading-tight mt-0.5">{prod.name}</h4>
                    {prod.description && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{prod.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="font-mono font-black text-emerald-400 text-xs">
                      ${prod.price.toLocaleString('es-AR')}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      prod.stock <= 0
                        ? 'bg-rose-950 text-rose-400'
                        : prod.stock <= prod.minStock
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-slate-950 text-slate-400'
                    }`}>
                      {prod.stock <= 0 ? 'Sin stock' : `${prod.stock} u.`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  Carrito de Cantina ({cart.length})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Vaciar
                  </button>
                )}
              </h3>

              {/* Cart List */}
              {cart.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="flex-1 pr-2">
                        <span className="font-bold text-white block truncate">{item.product.name}</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center border border-slate-800"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center border border-slate-800"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-rose-400 p-1 ml-1 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Tocá productos a la izquierda para sumarlos al carrito.
                </p>
              )}

              {/* Total & Checkout Form */}
              <form onSubmit={handleCompleteSale} className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-sm bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-400">TOTAL:</span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    ${cartTotal.toLocaleString('es-AR')}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Medio de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-emerald-400"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="MERCADO_PAGO">Mercado Pago (QR)</option>
                    <option value="POSNET">Tarjeta Débito/Crédito</option>
                  </select>
                </div>

                {/* Account Charge (Fiado / Cuenta Corriente) */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAccountCharge}
                      onChange={e => setIsAccountCharge(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span>Fiar / Cargar a Cuenta de Socio</span>
                  </label>

                  {isAccountCharge && (
                    <select
                      value={selectedMemberId}
                      onChange={e => setSelectedMemberId(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/50 text-white text-xs p-2.5 rounded-xl outline-none focus:border-amber-400"
                    >
                      <option value="">-- Seleccionar Socio --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} (DNI: {m.dni})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                    cart.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  REGISTRAR VENTA DE CANTINA
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Inventory & Stock */}
      {activeSubTab === 'stock' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow space-y-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Inventario de Mercadería
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Control de existencias, precios y reabastecimiento de productos.</p>
            </div>

            <button
              onClick={handleOpenNewProduct}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              + Agregar Producto
            </button>
          </div>

          {/* Table / Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {products.map(prod => {
              const profit = prod.price - prod.costPrice;
              return (
                <div
                  key={prod.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Image Thumbnail */}
                    <div className="w-full h-28 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 relative">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-slate-700" />
                      )}
                      {prod.barCode && (
                        <span className="absolute bottom-1 right-1 bg-slate-950/90 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-emerald-400" />
                          {prod.barCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {prod.category}
                      </span>
                      {prod.stock <= 0 ? (
                        <span className="text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded">
                          Sin Stock
                        </span>
                      ) : prod.stock <= prod.minStock ? (
                        <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
                          Poco Stock ({prod.stock})
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded">
                          Stock OK ({prod.stock})
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-white text-sm leading-tight">{prod.name}</h4>
                    {prod.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{prod.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Precio Venta</span>
                        <span className="text-emerald-400 font-bold">${prod.price.toLocaleString('es-AR')}</span>
                      </div>
                      {currentUser.role === 'ADMIN' ? (
                        <div>
                          <span className="text-slate-500 text-[10px] block">Ganancia Neta</span>
                          <span className="text-amber-400 font-bold">+${profit.toLocaleString('es-AR')}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-500 text-[10px] block">Stock Disponible</span>
                          <span className="text-white font-bold">{prod.stock} u.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => setRestockProduct(prod)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      + Reabastecer
                    </button>

                    <button
                      onClick={() => handleOpenEditProduct(prod)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2 rounded-lg text-xs transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 p-2 rounded-lg text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete Modal: Add / Edit Product (Barcode, Description, Cost, Price, Photo) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg my-auto overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {editingProduct ? 'Editar Producto de Cantina' : 'Agregar Nuevo Producto a Cantina'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Producto*</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ej: Agua Mineral 500ml"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={productForm.barCode}
                    onChange={e => setProductForm({ ...productForm, barCode: e.target.value })}
                    placeholder="Ej: 7790001112223"
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detalles del producto (ej: Sabor Vainilla, Talle L, etc.)..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-emerald-400"
                  >
                    <option value="BEBIDAS">Bebidas</option>
                    <option value="SUPLEMENTOS">Suplementos</option>
                    <option value="INDUMENTARIA">Indumentaria</option>
                    <option value="ACCESORIOS">Accesorios</option>
                    <option value="OTROS">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Precio Costo ($)</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={e => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    placeholder="700"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1 font-bold">Precio Venta ($)*</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    placeholder="1500"
                    className="w-full bg-slate-950 border-2 border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stock Inicial*</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    required
                    value={productForm.minStock}
                    onChange={e => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Foto / Imagen de Producto */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400">Imagen / Foto del Producto</label>

                {productForm.imageUrl ? (
                  <div className="relative w-full h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img src={productForm.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Subir Imagen</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                    </label>

                    <input
                      type="text"
                      value={productForm.imageUrl}
                      onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      placeholder="O pegar URL de imagen..."
                      className="bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Re-stock Inventory Order */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-5 shadow-2xl text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Reabastecer Mercadería</h3>
              <p className="text-xs text-slate-400 mt-0.5">{restockProduct.name}</p>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Cantidad de Unidades a Sumar:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={restockQty}
                  onChange={e => setRestockQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-base px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  Confirmar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
