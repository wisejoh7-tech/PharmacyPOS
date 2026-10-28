import React, { useState, useEffect, useRef } from 'react';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import supermarketSaleService from '../services/supermarketSaleService';
import staffService from '../services/staffService';
import barcodeService from '../services/barcodeService';
import toast from 'react-hot-toast';
import {
  FaPlus, FaMinus, FaSearch, FaShoppingCart, FaUserTie, FaUndo, FaTimes, FaBarcode, FaPrint, FaCamera
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SupermarketPOS = () => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('supermarket_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoriesList, setCategoriesList] = useState([]);
   const [lastScanned, setLastScanned] = useState(null);
   const [autoPrint, setAutoPrint] = useState(false);
   const scanInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    fetchStaff(controller.signal);
    fetchCategories();
    
    // Auto-focus the scan input on mount
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }

    // Global listener to redirect scanner input to the scan field
    const handleGlobalScan = (e) => {
      // Don't interfere if an input is already focused
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Ignore functional keys
      if (e.key.length > 1 && e.key !== 'Enter') return;

      if (scanInputRef.current) {
         scanInputRef.current.focus();
        // The character will be naturally typed into the focused input
      }
    };

    window.addEventListener('keydown', handleGlobalScan);
    return () => {
      controller.abort();
      window.removeEventListener('keydown', handleGlobalScan);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('supermarket_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategoriesList(response.data?.results || response.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchStaff = async (signal) => {
    try {
      const response = await staffService.getStaff({ signal });
      const list = response.data?.results || response.data;
      setStaffList(Array.isArray(list) ? list : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Failed to fetch staff", err);
      setStaffList([]);
    }
  };

  const fetchProducts = async (signal) => {
    try {
      const response = await productService.getProducts({ signal });
      const prods = response.data?.results || response.data;
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (error) {
       if (axios.isCancel(error)) return;
       console.error("Error fetching products:", error);
       if (navigator.onLine) {
         toast.error("Failed to load supermarket inventory.");
       }
    } finally {
       if (!(signal && signal.aborted)) {
         setLoading(false);
       }
    }
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if(existing.quantity >= product.stock) {
        toast.error("Not enough stock!");
        return;
      }
      updateQuantity(product.id, 1);
    } else {
      if(product.stock <= 0) {
        toast.error("Out of stock!");
        return;
      }
      setCart([...cart, { 
        id: product.id,
        name: product.name,
        unitPrice: parseFloat(product.unit_price), 
        quantity: 1
      }]);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const productCategory = (product.category_name || product.category || "").toLowerCase();
    const targetCategory = selectedCategory.toLowerCase();
    
    const matchesCategory = selectedCategory === 'All' || productCategory === targetCategory;
                            
    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const vat = subtotal * 0.075; // Using 7.5% for general retail VAT
  const totalAmount = subtotal + vat;

  const handleCheckout = async () => {
     if(cart.length === 0) {
        return toast.error("Cart is empty");
     }
     if(!staffId) {
        return toast.error("Please select a cashier");
     }
     
     try {
       setIsCheckingOut(true);
       const txId = "STX-" + Math.floor(Math.random() * 100000);

        const items = cart.map(item => ({
           product: item.id,
           quantity: item.quantity,
           unit_price: item.unitPrice,
           subtotal: (item.unitPrice * item.quantity).toFixed(2)
        }));

        await supermarketSaleService.processSale({
           transaction_id: txId,
           staff: staffId,
           total_amount: totalAmount.toFixed(2),
           payment_method: 'Cash',
           items: items
        });
       
        setLastSale({
           id: txId,
           cashier: staffList.find(s => s.id == staffId),
           items: cart,
           total: totalAmount,
           date: new Date().toLocaleString()
        });

       toast.success(`Retail Transaction Completed: ${txId}`);
       clearCart();
       fetchProducts();
        if (autoPrint) {
           setTimeout(() => window.print(), 500);
        }
     } catch (error) {
       console.error(error);
       toast.error("Checkout failed.");
     } finally {
       setIsCheckingOut(false);
     }
  };

  const handleMobileScan = async () => {
    try {
      const code = await barcodeService.scan();
      if (code) {
        const found = products.find(p => (p.barcode && p.barcode.toString().trim() === code) || (p.sku && p.sku.toString().trim() === code));
        if (found) {
          addToCart(found);
          setLastScanned({
            name: found.name,
            price: found.unit_price,
            time: Date.now()
          });
          toast.success(`Scanned: ${found.name} (₦${parseFloat(found.unit_price).toFixed(2)})`);
        } else {
          toast.error(`Barcode ${code} not found in inventory`);
        }
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error(error.message || "Failed to scan barcode");
    }
  };

  const categories = ['All', ...Array.from(new Set([
    ...categoriesList.filter(c => c.type === 'Supermarket').map(c => c.name),
    ...products.map(p => p.category_name || p.category).filter(Boolean)
  ]))];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 animate-in fade-in duration-500 text-sm">
      
      {/* Search and Product Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        
        <header className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-0 w-full max-w-[600px] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-50 focus-within:border-blue-500 transition-all shadow-sm">
              <input 
                type="text" 
                placeholder="Search products or scan barcode..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const code = searchTerm.trim();
                    if (!code) return;
                    const found = products.find(p => (p.barcode && p.barcode.toString().trim() === code) || (p.sku && p.sku.toString().trim() === code) || (p.name && p.name.toLowerCase().trim() === code.toLowerCase()));
                    if (found) {
                      const existingInCart = cart.find(i => i.id === found.id);
                      const currentQty = (existingInCart ? existingInCart.quantity : 0) + 1;
                      addToCart(found);
                      setLastScanned({
                        id: found.id,
                        name: found.name,
                        barcode: found.barcode || found.sku || code,
                        price: parseFloat(found.unit_price || 0),
                        quantity: currentQty,
                        totalAmount: parseFloat(found.unit_price || 0) * currentQty,
                        time: Date.now()
                      });
                      toast.success(`Scanned: ${found.name} | Qty: ${currentQty} | Total: ₦${(parseFloat(found.unit_price || 0) * currentQty).toFixed(2)}`);
                      setSearchTerm('');
                      e.target.focus();
                    } else {
                      toast.error(`Barcode "${code}" not found`);
                    }
                  }
                }}
                ref={scanInputRef}
                autoFocus
                className="flex-1 pl-4 pr-3 py-2 text-xs font-bold outline-none border-none bg-transparent"
              />
              <button
                onClick={handleMobileScan}
                className="p-3 bg-white text-blue-600 hover:text-blue-700 border-l border-slate-100 transition-colors shrink-0 flex items-center gap-1 font-bold text-[11px]"
                title="Scan with Camera"
              >
                <FaCamera className="text-sm" />
                <span className="hidden sm:inline">Camera Scan</span>
              </button>
            </div>

             <div className="flex items-center gap-3">
               <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-black uppercase tracking-wider">
                <FaBarcode className="text-blue-600 animate-pulse" /> Scanner Connected
               </span>
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                 <input 
                   type="checkbox" 
                   id="auto-print" 
                   checked={autoPrint} 
                   onChange={(e) => setAutoPrint(e.target.checked)}
                   className="w-3 h-3 accent-blue-500"
                 />
                 <label htmlFor="auto-print" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">Auto Print</label>
               </div>
               <Link to="/supermarket/inventory" className="btn-retail text-[12px] py-1.5 px-3 uppercase tracking-widest text-blue-500 border-blue-200">
                  <FaUndo /> View Stock
               </Link>
             </div>
          </div>

           {lastScanned && (Date.now() - lastScanned.time < 8000) && (
             <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in duration-300 shadow-xl shadow-blue-100 ring-4 ring-blue-50">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <FaBarcode className="text-2xl animate-pulse" />
                 </div>
                 <div>
                    <span className="text-[15px] font-black uppercase tracking-tight block">{lastScanned.name}</span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">
                      <span>Barcode: {lastScanned.barcode || 'N/A'}</span>
                      <span>•</span>
                      <span>Qty in Cart: <strong className="text-white text-xs">{lastScanned.quantity || 1}</strong></span>
                      <span>•</span>
                      <span>Unit Price: ₦{parseFloat(lastScanned.price || 0).toFixed(2)}</span>
                    </div>
                 </div>
               </div>
               <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-black tabular-nums block">₦{parseFloat(lastScanned.totalAmount || lastScanned.price || 0).toFixed(2)}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Total Amount</span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    title="Print Product Tag"
                  >
                    <FaPrint /> Print Tag
                  </button>
               </div>
             </div>
           )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
             {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all border ${
                   selectedCategory === cat 
                     ? 'bg-blue-500 text-white border-blue-500' 
                     : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
           <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                 <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest">Loading Items...</td></tr>
                 ) : (
                    filteredProducts.map(product => (
                       <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-3">
                             <p className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 uppercase tracking-tight">{product.name}</p>
                             <p className="text-[11px] font-bold text-slate-400">Items: {product.id}</p>
                          </td>
                          <td className="px-4 py-3">
                             <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[11px] font-black uppercase">
                                {product.category_name || product.category || 'Uncategorized'}
                             </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                             <span className={`text-[13px] font-black tabular-nums ${product.stock <= product.reorder_level ? 'text-red-500' : 'text-slate-900'}`}>{product.stock}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <span className="text-[13px] font-black text-slate-900 tabular-nums">₦{parseFloat(product.unit_price).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                             <button onClick={() => addToCart(product)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all shadow-sm">
                                <FaPlus className="text-[12px]" />
                             </button>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* Cart Column */}
      <div className="w-full lg:w-[320px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[600px] lg:h-auto text-xs">
         <header className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
           <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Checkout</h2>
           </div>
           <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[12px] font-black rounded-full uppercase tracking-widest">{cart.length} ITEMS</span>
         </header>

         <div className="p-4 border-b border-slate-50">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Authorized Cashier</label>
            <div className="relative">
              <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-xs" />
              <select 
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold outline-none appearance-none"
              >
                <option value="">Select Cashier...</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30 scrollbar-hide">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-20">
               <FaShoppingCart size={32} className="mb-2" />
               <p className="text-[13px] font-black uppercase">Cart is Empty</p>
             </div>
           ) : (
             cart.map(item => (
               <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group animate-in slide-in-from-right-2 duration-300">
                  <button onClick={() => removeFromCart(item.id)} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white text-red-400 border border-slate-100 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow">
                    <FaTimes className="text-[10px]" />
                  </button>
                  <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight pr-3 truncate">{item.name}</h4>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-50 p-0.5 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-md bg-white border border-slate-100 flex items-center justify-center text-[12px] text-slate-400 hover:text-blue-500"><FaMinus /></button>
                      <span className="text-[12px] font-black w-4 text-center tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-md bg-white border border-slate-100 flex items-center justify-center text-[12px] text-slate-400 hover:text-blue-500"><FaPlus /></button>
                    </div>
                    <span className="text-[13px] font-black text-slate-900 tabular-nums">₦{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
               </div>
             ))
           )}
         </div>

         <div className="p-4 bg-white border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-[13px] font-black text-slate-400 uppercase tracking-widest">
              <span>Total Payable</span>
              <span className="text-blue-600 text-sm tabular-nums">₦{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleCheckout} 
              disabled={isCheckingOut || cart.length === 0}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[12px] uppercase tracking-widest transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
            >
              {isCheckingOut ? "PROCESSING..." : "FINALIZE RETAIL SALE"}
            </button>
         </div>
      </div>

      {/* Simplified Receipt Modal */}
      {lastSale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-mono no-print">
           <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl shadow-lg">
                  <FaShoppingCart />
                </div>
                <h2 className="text-lg font-black text-slate-900 font-outfit uppercase">Retail Receipt</h2>
                <p className="text-[12px] font-bold text-slate-400">VISIT US AGAIN SOON</p>
              </div>
              <div className="space-y-2 text-[12px] mb-4 border-b border-dashed border-slate-200 pb-4">
                 <div className="flex justify-between"><span>STX ID:</span><span className="font-black text-slate-900">{lastSale.id}</span></div>
                 <div className="flex justify-between"><span>Date:</span><span className="font-black text-slate-900 font-sans">{lastSale.date}</span></div>
                 <div className="flex justify-between"><span>Cashier:</span><span className="font-black text-slate-900">{lastSale.cashier?.full_name || 'N/A'}</span></div>
              </div>
              <div className="space-y-2 border-b border-dashed border-slate-200 mb-4 pb-4">
                 {lastSale.items.map(item => (
                    <div key={item.id} className="flex justify-between text-[13px]">
                       <span className="truncate pr-2">{item.name} x{item.quantity}</span>
                       <span className="font-black">₦{(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                 ))}
              </div>
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                   <span className="text-xs font-black uppercase">Paid:</span>
                 </div>
                 <span className="text-2xl font-black text-blue-600 font-outfit tabular-nums">₦{lastSale.total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                 <button className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-[12px] font-black uppercase shadow-lg shadow-blue-100 flex items-center justify-center gap-2" onClick={() => window.print()}>
                   <FaPrint /> Print
                 </button>
                 <button className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-400 text-[12px] uppercase font-black" onClick={() => setLastSale(null)}>Done</button>
              </div>
           </div>
        </div>
      )}

      {/* Hidden Receipt for Automatic Printing if needed */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[200]">
          {lastSale && (
            <div className="p-8 w-full max-w-xs mx-auto text-black font-mono">
                <div className="text-center mb-8">
                    <h1 className="text-xl font-bold uppercase">Supermarket Receipt</h1>
                    <p className="text-xs">Retail & Quality Goods</p>
                </div>
                <div className="mb-4 border-b border-dashed pb-4 text-xs space-y-1">
                    <div className="flex justify-between"><span>ID:</span><span>{lastSale.id}</span></div>
                    <div className="flex justify-between"><span>Date:</span><span>{lastSale.date}</span></div>
                    <div className="flex justify-between"><span>Cashier:</span><span>{lastSale.cashier?.full_name}</span></div>
                </div>
                <div className="mb-4 border-b border-dashed pb-4 text-xs space-y-2">
                    {lastSale.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.name} x{item.quantity}</span>
                            <span>₦{(item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-base font-bold">
                    <span>TOTAL PAID:</span>
                    <span>₦{lastSale.total.toFixed(2)}</span>
                </div>
                <div className="mt-8 text-center text-[12px]">
                    <p>Thank you for shopping with us.</p>
                    <p>Have a great day!</p>
                </div>
            </div>
          )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .no-print { display: none !important; }
          .hidden.print\\:block { display: block !important; position: static !important; }
          .hidden.print\\:block * { visibility: visible; }
        }
      `}} />

    </div>
  );
};

export default SupermarketPOS;
