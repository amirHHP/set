'use client';

import { useState } from 'react';
import { setSystemSetting } from '@/app/actions/settings';
import { addProductAction, deleteProductAction, ProductData } from '@/app/actions/shop';
import { listUsersAction, deleteUserAction, PublicUser } from '@/app/actions/auth';
import { Key, ShoppingBag, Users, Plus, Trash2, ShieldAlert, Sparkles, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminPanelClientProps {
  initialAiConfig: { provider: string; model: string; apiKey: string };
  initialProducts: ProductData[];
  currentAdminId: string;
}

export default function AdminPanelClient({
  initialAiConfig,
  initialProducts,
  currentAdminId
}: AdminPanelClientProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'products' | 'users'>('ai');
  
  // AI Settings State
  const [apiKey, setApiKey] = useState(initialAiConfig.apiKey);
  const [model, setModel] = useState(initialAiConfig.model);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSaving, setAiSaving] = useState(false);

  // Products State
  const [products, setProducts] = useState<ProductData[]>(initialProducts);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('supplement');
  const [prodImage, setProdImage] = useState('whey_protein');
  const [prodSuccess, setProdSuccess] = useState(false);
  const [prodError, setProdError] = useState('');
  const [prodAdding, setProdAdding] = useState(false);

  // Users State
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await listUsersAction();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        setUsersError(res.error || 'خطا در بارگذاری کاربران.');
      }
    } catch (e) {
      setUsersError('خطا در اتصال به سرور.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError('');
    setAiSaveSuccess(false);
    setAiSaving(true);

    try {
      const resKey = await setSystemSetting('gemini-api-key', apiKey);
      const resModel = await setSystemSetting('ai-model-gemini', model);

      if (resKey.success && resModel.success) {
        setAiSaveSuccess(true);
        setTimeout(() => setAiSaveSuccess(false), 3000);
      } else {
        setAiError(resKey.error || resModel.error || 'خطا در ثبت تنظیمات.');
      }
    } catch (e) {
      setAiError('خطا در ارتباط با سرور.');
    } finally {
      setAiSaving(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError('');
    setProdSuccess(false);
    
    const priceNum = parseInt(prodPrice);
    if (!prodName || !prodDesc || isNaN(priceNum) || !prodCategory || !prodImage) {
      setProdError('لطفاً تمام فیلدها را به درستی پر کنید.');
      return;
    }

    setProdAdding(true);

    try {
      const res = await addProductAction({
        name: prodName,
        description: prodDesc,
        price: priceNum,
        image: prodImage,
        category: prodCategory
      });

      if (res.success && res.product) {
        setProducts([res.product, ...products]);
        setProdSuccess(true);
        
        // Reset form
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        
        setTimeout(() => setProdSuccess(false), 3000);
      } else {
        setProdError(res.error || 'خطا در افزودن محصول.');
      }
    } catch (e) {
      setProdError('خطا در ارتباط با سرور.');
    } finally {
      setProdAdding(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('آیا از حذف این کالا اطمینان دارید؟')) return;

    try {
      const res = await deleteProductAction(id);
      if (res.success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert(res.error || 'خطا در حذف محصول.');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;

    try {
      const res = await deleteUserAction(id);
      if (res.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert(res.error || 'خطا در حذف کاربر.');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور.');
    }
  };

  // Helper to format values in Farsi
  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'supplement': return 'مکمل';
      case 'clothing': return 'پوشاک';
      case 'equipment': return 'تجهیزات ورزشی';
      default: return cat;
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '30px',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'start'
    }}>
      
      {/* Sidebar navigation */}
      <div style={{ flex: '1 1 220px', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('ai')}
          className="btn"
          style={{
            justifyContent: 'flex-start',
            background: activeTab === 'ai' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'ai' ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '12px 16px'
          }}
        >
          <Key size={18} />
          <span>تنظیمات هوش مصنوعی</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className="btn"
          style={{
            justifyContent: 'flex-start',
            background: activeTab === 'products' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'products' ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '12px 16px'
          }}
        >
          <ShoppingBag size={18} />
          <span>مدیریت محصولات</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            loadUsers();
          }}
          className="btn"
          style={{
            justifyContent: 'flex-start',
            background: activeTab === 'users' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'users' ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '12px 16px'
          }}
        >
          <Users size={18} />
          <span>مدیریت کاربران</span>
        </button>
      </div>

      {/* Main panel content */}
      <div style={{ flex: '3 1 600px' }}>
        
        {/* Tab 1: AI Config */}
        {activeTab === 'ai' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={22} />
              <span>تنظیمات هوش مصنوعی (Google Gemini)</span>
            </h2>

            {aiSaveSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                padding: '12px',
                borderRadius: '10px',
                color: '#22c55e',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                <CheckCircle size={18} />
                <span>تنظیمات هوش مصنوعی با موفقیت ذخیره شد.</span>
              </div>
            )}

            {aiError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                <AlertCircle size={18} />
                <span>{aiError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAi}>
              <div className="form-group">
                <label className="form-label">کلید دسترسی (Gemini API Key)</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  برای کارکرد صحیح ثبت اندازه‌ها و تولید برنامه تمرینی ورزشی، کلید API را از کنسول Google AI دریافت کرده و اینجا ذخیره کنید.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">مدل هوش مصنوعی پیش‌فرض</label>
                <select
                  className="input-field"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ background: '#181b24', color: 'white', direction: 'ltr' }}
                >
                  <option value="gemini-2.0-flash">models/gemini-2.0-flash (سریع و بهینه‌ترین)</option>
                  <option value="gemini-2.0-flash-lite">models/gemini-2.0-flash-lite (بسیار سریع و سبک)</option>
                  <option value="gemini-1.5-flash">models/gemini-1.5-flash</option>
                  <option value="gemini-1.5-pro">models/gemini-1.5-pro (دقیق و تحلیلیتر)</option>
                  <option value="gemini-2.5-pro-preview-05-06">models/gemini-2.5-pro-preview-05-06 (مدل فکرکننده هوشمند)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                disabled={aiSaving}
              >
                <Sparkles size={16} />
                <span>{aiSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره کلید و مدل هوش مصنوعی'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Product Management */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Add product form */}
            <div className="glass-card">
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={22} />
                <span>افزودن محصول جدید به فروشگاه</span>
              </h2>

              {prodSuccess && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  padding: '12px',
                  borderRadius: '10px',
                  color: '#22c55e',
                  fontSize: '0.85rem',
                  marginBottom: '20px'
                }}>
                  <CheckCircle size={18} />
                  <span>محصول ورزشی جدید با موفقیت اضافه شد.</span>
                </div>
              )}

              {prodError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '12px',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginBottom: '20px'
                }}>
                  <AlertCircle size={18} />
                  <span>{prodError}</span>
                </div>
              )}

              <form onSubmit={handleAddProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">نام کالا</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="مثال: پودر گلوتامین ۲۵۰ گرمی کارن"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">قیمت (تومان)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="مثال: 580000"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">دسته‌بندی محصول</label>
                    <select
                      className="input-field"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      style={{ background: '#181b24', color: 'white' }}
                    >
                      <option value="supplement">🥛 مکمل‌های بدنسازی</option>
                      <option value="clothing">👚 پوشاک ورزشی بانوان</option>
                      <option value="equipment">🏋️ تجهیزات باشگاهی و لوازم جانبی</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">کلید تصویر کالا (تصویر پیش‌فرض)</label>
                    <select
                      className="input-field"
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      style={{ background: '#181b24', color: 'white', direction: 'ltr' }}
                    >
                      <option value="whey_protein">whey_protein (پروتئین وی)</option>
                      <option value="creatine">creatine (کراتین)</option>
                      <option value="resistance_bands">resistance_bands (کش بدنسازی)</option>
                      <option value="dumbbells">dumbbells (دمبل)</option>
                      <option value="sport_bra">sport_bra (نیم‌تنه)</option>
                      <option value="leggings">leggings (شلوار لگ)</option>
                      <option value="generic">generic (کالا ورزشی عمومی)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">توضیحات و مشخصات کالا</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="کیفیت کالا، نوع استفاده، طعم، راهنمای سایز..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    style={{ resize: 'none' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                  disabled={prodAdding}
                >
                  <Plus size={16} />
                  <span>{prodAdding ? 'در حال ایجاد...' : 'افزودن محصول به لیست فروش'}</span>
                </button>
              </form>
            </div>

            {/* List of current products */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>کالاهای فعال در فروشگاه</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>{p.name}</strong>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 8px', marginLeft: '8px' }}>
                        {getCategoryLabel(p.category)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        قیمت: {(p.price).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                    >
                      <Trash2 size={14} />
                      <span>حذف کالا</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: User Management */}
        {activeTab === 'users' && (
          <div className="glass-card">
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} />
              <span>مدیریت کاربران رجیستر شده</span>
            </h2>

            {usersError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                <AlertCircle size={18} />
                <span>{usersError}</span>
              </div>
            )}

            {usersLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>در حال دریافت لیست کاربران...</span>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                هیچ کاربری ثبت نشده است.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users.map(u => (
                  <div key={u.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>{u.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        نام کاربری: <code>{u.username}</code> | نقش:{' '}
                        <span style={{ color: u.role === 'admin' ? 'var(--secondary)' : 'var(--text-main)', fontWeight: '700' }}>
                          {u.role === 'admin' ? 'مدیر سیستم' : 'ورزشکار'}
                        </span>
                      </span>
                    </div>

                    {u.id !== currentAdminId ? (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        <span>حذف کاربر</span>
                      </button>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '6px 12px',
                        borderRadius: '8px'
                      }}>
                        <ShieldAlert size={14} />
                        <span>حساب کاربری شما (مدیر)</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
