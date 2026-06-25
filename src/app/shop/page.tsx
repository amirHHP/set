'use client';

import { useState, useEffect } from 'react';
import { getProducts, ProductData } from '@/app/actions/shop';
import { getCurrentUser, PublicUser } from '@/app/actions/auth';
import { ShoppingCart, Info, Trash2, Plus, Minus, CheckCircle, ArrowLeft } from 'lucide-react';

interface CartItem extends ProductData {
  quantity: number;
}

export default function ShopPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const u = await getCurrentUser();
        setUser(u);

        const res = await getProducts();
        if (res.success && res.products) {
          setProducts(res.products);
        } else {
          setError(res.error || 'خطا در بارگذاری محصولات.');
        }
      } catch (err) {
        console.error(err);
        setError('خطا در بارگذاری اطلاعات فروشگاه.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    // Load cart from localStorage asynchronously to avoid sync effect warnings
    const savedCart = localStorage.getItem('set_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setTimeout(() => setCart(parsed), 0);
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('set_cart', JSON.stringify(newCart));
  };

  const addToCart = (product: ProductData) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      saveCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      saveCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];
    saveCart(updated);
  };

  const removeFromCart = (id: string) => {
    saveCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((count, item) => count + item.quantity, 0);

  const filteredProducts = category === 'all' 
    ? products 
    : products.filter(p => p.category === category);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !phone) return;
    setCheckoutSuccess(true);
    clearCart();
  };

  // Helper to format category tags in Farsi
  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'supplement': return 'مکمل‌ها';
      case 'equipment': return 'تجهیزات ورزشی';
      case 'clothing': return 'پوشاک ورزشی';
      default: return cat;
    }
  };

  // Render product images with icons as fallback since we use text labels
  const renderProductImage = (imageName: string) => {
    // Custom inline style mapping for placeholder illustration
    let color = 'linear-gradient(135deg, #36132d 0%, #4a1c40 100%)';
    if (imageName === 'whey_protein' || imageName === 'creatine') {
      color = 'linear-gradient(135deg, #1e293b 0%, #475569 100%)';
    } else if (imageName === 'resistance_bands' || imageName === 'dumbbells') {
      color = 'linear-gradient(135deg, #16222f 0%, #ff6b52 100%)';
    } else if (imageName === 'sport_bra' || imageName === 'leggings') {
      color = 'linear-gradient(135deg, #2e1065 0%, #8b5cf6 100%)';
    }

    return (
      <div style={{
        width: '100%',
        height: '180px',
        background: color,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '20px'
      }}>
        {imageName === 'whey_protein' && '🥛 پروتئین وی'}
        {imageName === 'creatine' && '⚡ کراتین خالص'}
        {imageName === 'resistance_bands' && '🎗️ کش مینی لوپ'}
        {imageName === 'dumbbells' && '🏋️ دمبل ۵ کیلویی'}
        {imageName === 'sport_bra' && '👚 نیم‌تنه ورزشی'}
        {imageName === 'leggings' && '👖 لگ ورزشی کمر پهن'}
        {!['whey_protein', 'creatine', 'resistance_bands', 'dumbbells', 'sport_bra', 'leggings'].includes(imageName) && '📦 کالا ورزشی'}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0 50px', position: 'relative' }}>
      
      {/* Shop Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
            فروشگاه ورزشی سِت
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            مکمل‌های اورجینال، لباس‌های راحت و تجهیزات تمرینی تخصصی بانوان
          </p>
        </div>

        {/* Floating Cart Trigger */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="btn btn-primary"
          style={{ position: 'relative', padding: '12px 20px', gap: '10px' }}
        >
          <ShoppingCart size={20} />
          <span>سبد خرید</span>
          {totalItems > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'white',
              color: 'var(--primary)',
              borderRadius: '9999px',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '800',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Admin Notice */}
      {user && user.role === 'admin' && (
        <div style={{
          background: 'rgba(212, 163, 115, 0.12)',
          border: '1px dashed var(--secondary)',
          borderRadius: '12px',
          padding: '16px',
          color: 'var(--secondary)',
          fontSize: '0.9rem',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={18} />
          <span>شما به عنوان مدیر وارد شده‌اید. برای اضافه کردن کالا یا تغییر محصولات فروشگاه به <strong>پنل مدیریت</strong> مراجعه کنید.</span>
        </div>
      )}

      {/* Category Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {[
          { id: 'all', label: 'همه محصولات' },
          { id: 'supplement', label: 'مکمل‌ها' },
          { id: 'clothing', label: 'پوشاک' },
          { id: 'equipment', label: 'تجهیزات ورزشی' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className="btn"
            style={{
              background: category === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
              color: category === tab.id ? 'white' : 'var(--text-muted)',
              border: category === tab.id ? 'none' : '1px solid var(--border)',
              padding: '8px 16px',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>در حال بارگذاری محصولات...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
          هیچ محصولی در این دسته‌بندی وجود ندارد.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '16px'
            }}>
              <div>
                <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                  {renderProductImage(prod.image)}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {getCategoryLabel(prod.category)}
                  </span>
                  <span style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '1.1rem' }}>
                    {(prod.price).toLocaleString('fa-IR')} <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>تومان</span>
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', lineHeight: '1.4' }}>{prod.name}</h3>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  marginBottom: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: '3',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{prod.description}</p>
              </div>

              <button 
                onClick={() => addToCart(prod)}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                <ShoppingCart size={16} />
                <span>افزودن به سبد خرید</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cart Sidebar / Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          display: 'flex',
          justifyContent: 'flex-start' /* Open on the right/left depending on direction. Since RTL, we align to left */
        }} onClick={() => setIsCartOpen(false)}>
          
          <div style={{
            width: '100%',
            maxWidth: '400px',
            height: '100%',
            background: '#12141a',
            borderRight: '1px solid var(--border)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Cart Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={24} className="logoIcon" />
                  <span>سبد خرید شما</span>
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  بستن
                </button>
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  سبد خرید شما در حال حاضر خالی است.
                </div>
              ) : (
                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{
                      display: 'flex',
                      gap: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '700' }}>
                          {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                        </span>
                        
                        {/* Quantity controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px', padding: '2px' }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px', padding: '2px' }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', alignSelf: 'center', padding: '8px' }}
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>جمع کل سبد:</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {cartTotal.toLocaleString('fa-IR')} <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>تومان</span>
                  </span>
                </div>

                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                >
                  <span>ادامه و ثبت سفارش</span>
                  <ArrowLeft size={18} />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Checkout Dialog Modal */}
      {isCheckoutOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '460px',
            background: '#12141a',
            position: 'relative'
          }}>
            
            {checkoutSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ color: '#22c55e', marginBottom: '16px' }}>
                  <CheckCircle size={60} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>خرید شما با موفقیت ثبت شد!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '24px' }}>
                  سفارش شما با موفقیت ثبت گردید و همکاران ما برای هماهنگی ارسال با شما تماس خواهند گرفت. از خرید شما سپاسگزاریم!
                </p>
                <button 
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setIsCartOpen(false);
                    setCheckoutSuccess(false);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  متوجه شدم
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>تکمیل سفارش و ارسال</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  لطفاً آدرس و شماره تلفن خود را جهت هماهنگی ارسال محصولات مکمل و باشگاهی وارد نمایید.
                </p>

                <form onSubmit={handleCheckoutSubmit}>
                  <div className="form-group">
                    <label className="form-label">شماره تماس (تلفن همراه)</label>
                    <input 
                      type="tel"
                      className="input-field"
                      placeholder="مثال: 09123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">آدرس دقیق پستی</label>
                    <textarea 
                      className="input-field"
                      rows={3}
                      placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ resize: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '12px' }}
                    >
                      ثبت نهایی سفارش
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="btn btn-secondary"
                      style={{ padding: '12px 20px' }}
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
