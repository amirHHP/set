/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { 
  FullAiConfig, 
  AiProvider, 
  setSystemSettingsBatch, 
  fetchAvailableGeminiModels, 
  testAiConnectionAction 
} from '@/app/actions/settings';
import { addProductAction, deleteProductAction, ProductData } from '@/app/actions/shop';
import { 
  listUsersAction, 
  deleteUserAction, 
  updateUserRoleAction, 
  resetUserPasswordAction, 
  createUserAction, 
  getAdminStatsAction, 
  PublicUser 
} from '@/app/actions/auth';
import { 
  Key, 
  ShoppingBag, 
  Users, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Search,
  UserPlus,
  Lock,
  Globe,
  Zap,
  Activity,
  Check
} from 'lucide-react';

interface AdminPanelClientProps {
  initialAiConfig: FullAiConfig;
  initialProducts: ProductData[];
  currentAdminId: string;
}

export default function AdminPanelClient({
  initialAiConfig,
  initialProducts,
  currentAdminId
}: AdminPanelClientProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'products'>('users');

  // -------------------------------------------------------------
  // AI Keys & Providers State
  // -------------------------------------------------------------
  const [activeProvider, setActiveProvider] = useState<AiProvider>(initialAiConfig.provider || 'gemini');
  
  // Gemini
  const [geminiApiKey, setGeminiApiKey] = useState(initialAiConfig.geminiApiKey || '');
  const [geminiModel, setGeminiModel] = useState(initialAiConfig.geminiModel || 'gemini-2.0-flash');
  const [geminiBaseUrl, setGeminiBaseUrl] = useState(initialAiConfig.geminiBaseUrl || '');

  // OpenAI
  const [openaiApiKey, setOpenaiApiKey] = useState(initialAiConfig.openaiApiKey || '');
  const [openaiModel, setOpenaiModel] = useState(initialAiConfig.openaiModel || 'gpt-4o-mini');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(initialAiConfig.openaiBaseUrl || '');

  // DeepSeek
  const [deepseekApiKey, setDeepseekApiKey] = useState(initialAiConfig.deepseekApiKey || '');
  const [deepseekModel, setDeepseekModel] = useState(initialAiConfig.deepseekModel || 'deepseek-chat');
  const [deepseekBaseUrl, setDeepseekBaseUrl] = useState(initialAiConfig.deepseekBaseUrl || '');

  // Anthropic
  const [anthropicApiKey, setAnthropicApiKey] = useState(initialAiConfig.anthropicApiKey || '');
  const [anthropicModel, setAnthropicModel] = useState(initialAiConfig.anthropicModel || 'claude-3-5-haiku-20241022');

  // OpenRouter
  const [openrouterApiKey, setOpenrouterApiKey] = useState(initialAiConfig.openrouterApiKey || '');
  const [openrouterModel, setOpenrouterModel] = useState(initialAiConfig.openrouterModel || 'google/gemini-2.0-flash-001');
  const [openrouterBaseUrl, setOpenrouterBaseUrl] = useState(initialAiConfig.openrouterBaseUrl || '');

  // Visibility toggle for API keys
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const toggleKeyVisibility = (providerKey: string) => {
    setShowKey(prev => ({ ...prev, [providerKey]: !prev[providerKey] }));
  };

  // AI Save feedback
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [aiError, setAiError] = useState('');

  // AI Live Connection Testing
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: string;
    success: boolean;
    message?: string;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  // Gemini dynamic models
  const [fetchedModels, setFetchedModels] = useState<any[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchModelsError, setFetchModelsError] = useState('');

  const handleFetchModels = async () => {
    setFetchingModels(true);
    setFetchModelsError('');
    try {
      const res = await fetchAvailableGeminiModels();
      if (res.success && res.models) {
        setFetchedModels(res.models);
      } else {
        setFetchModelsError(res.error || 'خطا در دریافت لیست مدل‌های جمینای.');
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setFetchModelsError('خطا در ارتباط با سرور.');
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    if (initialAiConfig.geminiApiKey) {
      const timer = setTimeout(() => {
        handleFetchModels();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError('');
    setAiSaveSuccess(false);
    setAiSaving(true);

    try {
      const payload: Record<string, string> = {
        'ai-provider': activeProvider,
        'gemini-api-key': geminiApiKey,
        'ai-model-gemini': geminiModel,
        'gemini-base-url': geminiBaseUrl,
        'openai-api-key': openaiApiKey,
        'ai-model-openai': openaiModel,
        'openai-base-url': openaiBaseUrl,
        'deepseek-api-key': deepseekApiKey,
        'ai-model-deepseek': deepseekModel,
        'deepseek-base-url': deepseekBaseUrl,
        'anthropic-api-key': anthropicApiKey,
        'ai-model-anthropic': anthropicModel,
        'openrouter-api-key': openrouterApiKey,
        'ai-model-openrouter': openrouterModel,
        'openrouter-base-url': openrouterBaseUrl,
      };

      const res = await setSystemSettingsBatch(payload);
      if (res.success) {
        setAiSaveSuccess(true);
        setTimeout(() => setAiSaveSuccess(false), 3500);
      } else {
        setAiError(res.error || 'خطا در ثبت تنظیمات.');
      }
    } catch (e: any) {
      console.error('Error saving AI config:', e);
      setAiError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setAiSaving(false);
    }
  };

  const handleTestConnection = async (provider: AiProvider) => {
    let keyToTest = '';
    let modelToTest = '';
    let baseUrlToTest = '';

    if (provider === 'gemini') {
      keyToTest = geminiApiKey;
      modelToTest = geminiModel;
      baseUrlToTest = geminiBaseUrl;
    } else if (provider === 'openai') {
      keyToTest = openaiApiKey;
      modelToTest = openaiModel;
      baseUrlToTest = openaiBaseUrl;
    } else if (provider === 'deepseek') {
      keyToTest = deepseekApiKey;
      modelToTest = deepseekModel;
      baseUrlToTest = deepseekBaseUrl;
    } else if (provider === 'anthropic') {
      keyToTest = anthropicApiKey;
      modelToTest = anthropicModel;
    } else if (provider === 'openrouter') {
      keyToTest = openrouterApiKey;
      modelToTest = openrouterModel;
      baseUrlToTest = openrouterBaseUrl;
    }

    if (!keyToTest) {
      setTestResult({
        provider,
        success: false,
        error: 'لطفاً ابتدا کلید API این ارائه‌دهنده را در کادر مربوطه وارد کنید.'
      });
      return;
    }

    setTestingProvider(provider);
    setTestResult(null);

    try {
      const res = await testAiConnectionAction({
        provider,
        apiKey: keyToTest,
        model: modelToTest,
        baseUrl: baseUrlToTest
      });

      setTestResult({
        provider,
        success: res.success,
        message: res.message,
        error: res.error,
        latencyMs: res.latencyMs
      });
    } catch (err: any) {
      setTestResult({
        provider,
        success: false,
        error: `خطا در ارتباط: ${err.message || 'پاسخی دریافت نشد'}`
      });
    } finally {
      setTestingProvider(null);
    }
  };

  // -------------------------------------------------------------
  // Users Management State
  // -------------------------------------------------------------
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  // System Stats
  const [stats, setStats] = useState<{
    totalUsers: number;
    adminCount: number;
    athleteCount: number;
    totalSizes: number;
    totalPrograms: number;
    totalLogs: number;
  } | null>(null);

  // Add User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'coach' | 'user'>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState(false);

  // Reset Password State
  const [resettingUser, setResettingUser] = useState<PublicUser | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Role toggle state
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const loadUsersAndStats = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const [uRes, sRes] = await Promise.all([
        listUsersAction(),
        getAdminStatsAction()
      ]);

      if (uRes.success && uRes.users) {
        setUsers(uRes.users);
      } else {
        setUsersError(uRes.error || 'خطا در بارگذاری کاربران.');
      }

      if (sRes.success && sRes.stats) {
        setStats(sRes.stats);
      }
    } catch (e) {
      console.error('Error loading users:', e);
      setUsersError('خطا در برقراری ارتباط با پایگاه داده.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndStats();
  }, []);

  const handleChangeUserRole = async (user: PublicUser, newRole: 'admin' | 'coach' | 'user') => {
    if (user.role === newRole) return;
    const roleTitle = newRole === 'admin' ? 'مدیر سیستم' : newRole === 'coach' ? 'مربی ورزشی' : 'ورزشکار (کاربر عادی)';
    
    if (!confirm(`آیا از تغییر نقش «${user.name}» به «${roleTitle}» اطمینان دارید؟`)) {
      return;
    }

    setChangingRoleId(user.id);
    try {
      const res = await updateUserRoleAction(user.id, newRole);
      if (res.success) {
        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        loadUsersAndStats();
      } else {
        alert(res.error || 'خطا در تغییر نقش کاربر.');
      }
    } catch (err: any) {
      alert(`خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف دائمی کاربر «${name}» اطمینان دارید؟ تمام سوابق، اندازه‌ها و برنامه‌های این کاربر حذف خواهند شد.`)) {
      return;
    }

    try {
      const res = await deleteUserAction(id);
      if (res.success) {
        setUsers(users.filter(u => u.id !== id));
        loadUsersAndStats();
      } else {
        alert(res.error || 'خطا در حذف کاربر.');
      }
    } catch (e: any) {
      alert(`خطا در ارتباط با سرور: ${e.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserSuccess(false);

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword) {
      setAddUserError('نام، نام کاربری و رمز عبور الزامی هستند.');
      return;
    }

    if (newUserPassword.length < 6) {
      setAddUserError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setAddingUser(true);
    try {
      const res = await createUserAction({
        name: newUserName,
        username: newUserUsername,
        email: newUserEmail || undefined,
        password: newUserPassword,
        role: newUserRole
      });

      if (res.success && res.user) {
        setAddUserSuccess(true);
        setUsers([res.user, ...users]);
        setNewUserName('');
        setNewUserUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('user');
        loadUsersAndStats();
        setTimeout(() => {
          setAddUserSuccess(false);
          setShowAddUser(false);
        }, 2000);
      } else {
        setAddUserError(res.error || 'خطا در ایجاد کاربر.');
      }
    } catch (err: any) {
      setAddUserError(`خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setAddingUser(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    setResetError('');
    setResetSuccess(false);

    if (!newPasswordVal || newPasswordVal.length < 6) {
      setResetError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await resetUserPasswordAction(resettingUser.id, newPasswordVal);
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          setResettingUser(null);
          setNewPasswordVal('');
        }, 2000);
      } else {
        setResetError(res.error || 'خطا در تغییر رمز عبور.');
      }
    } catch (err: any) {
      setResetError(`خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = 
      roleFilter === 'all' ||
      (roleFilter === 'admin' && u.role === 'admin') ||
      (roleFilter === 'user' && u.role !== 'admin');

    return matchesSearch && matchesRole;
  });

  // -------------------------------------------------------------
  // Product Management State
  // -------------------------------------------------------------
  const [products, setProducts] = useState<ProductData[]>(initialProducts);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('supplement');
  const [prodImage, setProdImage] = useState('whey_protein');
  const [prodSuccess, setProdSuccess] = useState(false);
  const [prodError, setProdError] = useState('');
  const [prodAdding, setProdAdding] = useState(false);

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
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setTimeout(() => setProdSuccess(false), 3000);
      } else {
        setProdError(res.error || 'خطا در افزودن محصول.');
      }
    } catch (e) {
      console.error('Error adding product:', e);
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
      console.error('Error deleting product:', e);
      alert('خطا در ارتباط با سرور.');
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'supplement': return 'مکمل';
      case 'clothing': return 'پوشاک';
      case 'equipment': return 'تجهیزات ورزشی';
      default: return cat;
    }
  };

  // Helper to check if a provider has a saved key
  const hasKey = (provider: AiProvider) => {
    switch (provider) {
      case 'gemini': return Boolean(geminiApiKey);
      case 'openai': return Boolean(openaiApiKey);
      case 'deepseek': return Boolean(deepseekApiKey);
      case 'anthropic': return Boolean(anthropicApiKey);
      case 'openrouter': return Boolean(openrouterApiKey);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'start' }}>
      
      {/* ----------------------------------------- */}
      {/* Sidebar Navigation */}
      {/* ----------------------------------------- */}
      <div style={{ flex: '1 1 240px', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        <button
          onClick={() => setActiveTab('users')}
          className="btn"
          style={{
            justifyContent: 'space-between',
            background: activeTab === 'users' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'users' ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '14px 18px',
            fontSize: '0.95rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} />
            <span>مدیریت کاربران</span>
          </div>
          {stats && (
            <span style={{
              background: activeTab === 'users' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem'
            }}>
              {stats.totalUsers}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className="btn"
          style={{
            justifyContent: 'space-between',
            background: activeTab === 'ai' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'ai' ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '14px 18px',
            fontSize: '0.95rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={18} />
            <span>کلیدهای هوش مصنوعی</span>
          </div>
          <span style={{
            background: activeTab === 'ai' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem'
          }}>
            {activeProvider}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className="btn"
          style={{
            justifyContent: 'space-between',
            background: activeTab === 'products' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'products' ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '14px 18px',
            fontSize: '0.95rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={18} />
            <span>مدیریت محصولات</span>
          </div>
          <span style={{
            background: activeTab === 'products' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem'
          }}>
            {products.length}
          </span>
        </button>

        {/* Quick System Summary */}
        {stats && (
          <div style={{
            marginTop: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} style={{ color: 'var(--secondary)' }} />
              <span>خلاصه آمار سامانه</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>کل ورزشکاران:</span>
              <strong style={{ color: 'var(--text-main)' }}>{stats.athleteCount} نفر</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>مدیران سامانه:</span>
              <strong style={{ color: 'var(--secondary)' }}>{stats.adminCount} نفر</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>رکوردهای فیزیکی:</span>
              <strong style={{ color: 'var(--text-main)' }}>{stats.totalSizes} ثبت</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>برنامه‌های ورزشی:</span>
              <strong style={{ color: 'var(--text-main)' }}>{stats.totalPrograms} برنامه</strong>
            </div>
          </div>
        )}

      </div>

      {/* ----------------------------------------- */}
      {/* Main Content Area */}
      {/* ----------------------------------------- */}
      <div style={{ flex: '3 1 700px' }}>

        {/* ======================================================== */}
        {/* TAB 1: USERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header & Actions */}
            <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Users size={22} />
                    <span>مدیریت کاربران سامانه</span>
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    مشاهده کاربران لاگین کرده، ارتقا/تغییر نقش کاربری، تغییر رمز عبور و سوابق فعالیت
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
                  >
                    <UserPlus size={16} />
                    <span>{showAddUser ? 'بستن فرم' : 'افزودن کاربر جدید'}</span>
                  </button>

                  <button
                    onClick={loadUsersAndStats}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    title="بروزرسانی لیست"
                    disabled={usersLoading}
                  >
                    <RefreshCw size={15} style={{ animation: usersLoading ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
              </div>

              {/* Add User Expandable Form */}
              {showAddUser && (
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '16px',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserPlus size={18} style={{ color: 'var(--primary)' }} />
                    <span>ثبت کاربر جدید توسط مدیر</span>
                  </h3>

                  {addUserSuccess && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircle size={16} />
                      <span>کاربر جدید با موفقیت ایجاد شد.</span>
                    </div>
                  )}

                  {addUserError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} />
                      <span>{addUserError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>نام و نام خانوادگی</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="مثلاً: سارا محمدی"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>نام کاربری</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="sara_m"
                          value={newUserUsername}
                          onChange={(e) => setNewUserUsername(e.target.value)}
                          style={{ direction: 'ltr' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>ایمیل (اختیاری)</label>
                        <input
                          type="email"
                          className="input-field"
                          placeholder="sara@example.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          style={{ direction: 'ltr' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>رمز عبور (حداقل ۶ کاراکتر)</label>
                        <input
                          type="password"
                          className="input-field"
                          placeholder="******"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          style={{ direction: 'ltr' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>نقش کاربر</label>
                        <select
                          className="input-field"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'coach' | 'user')}
                          style={{ background: '#181b24', color: 'white' }}
                        >
                          <option value="user">ورزشکار (کاربر عادی)</option>
                          <option value="coach">مربی ورزشی 🏋️</option>
                          <option value="admin">مدیر سیستم (دسترسی کامل) 🛡️</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                        disabled={addingUser}
                      >
                        {addingUser ? 'در حال ثبت...' : 'ثبت کاربر'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Search and Filter Controls */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 260px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="جستجو بر اساس نام، نام کاربری یا ایمیل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingRight: '38px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
                  <button
                    onClick={() => setRoleFilter('all')}
                    style={{
                      border: 'none',
                      background: roleFilter === 'all' ? 'var(--primary)' : 'transparent',
                      color: roleFilter === 'all' ? 'white' : 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    همه ({users.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('admin')}
                    style={{
                      border: 'none',
                      background: roleFilter === 'admin' ? 'var(--primary)' : 'transparent',
                      color: roleFilter === 'admin' ? 'white' : 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    مدیران ({users.filter(u => u.role === 'admin').length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('user')}
                    style={{
                      border: 'none',
                      background: roleFilter === 'user' ? 'var(--primary)' : 'transparent',
                      color: roleFilter === 'user' ? 'white' : 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    ورزشکاران ({users.filter(u => u.role !== 'admin').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Password Reset Modal/Banner */}
            {resettingUser && (
              <div className="glass-card animate-fade-in" style={{
                border: '1px solid var(--secondary)',
                background: 'rgba(212, 163, 115, 0.08)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Lock size={18} />
                    <span>تغییر رمز عبور برای «{resettingUser.name}» (@{resettingUser.username})</span>
                  </h3>
                  <button
                    onClick={() => { setResettingUser(null); setResetError(''); setResetSuccess(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    بستن
                  </button>
                </div>

                {resetSuccess && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    color: '#22c55e',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '12px'
                  }}>
                    رمز عبور با موفقیت بروزرسانی شد.
                  </div>
                )}

                {resetError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '12px'
                  }}>
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleResetPassword} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    style={{ flex: '1 1 200px', direction: 'ltr' }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'در حال ثبت...' : 'ثبت رمز جدید'}
                  </button>
                </form>
              </div>
            )}

            {/* Users List Cards */}
            <div className="glass-card" style={{ padding: '20px' }}>
              {usersError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}>
                  {usersError}
                </div>
              )}

              {usersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '50px 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>در حال دریافت لیست کاربران...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  کاربری با این مشخصات یافت نشد.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentAdminId;
                    const initialChar = u.name ? u.name.trim().charAt(0) : 'U';

                    return (
                      <div
                        key={u.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: isSelf ? '1px solid rgba(255, 107, 82, 0.4)' : '1px solid var(--border)',
                          padding: '16px 20px',
                          borderRadius: '14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '16px',
                          transition: 'var(--transition)'
                        }}
                      >
                        {/* User Info with Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: u.role === 'admin' 
                              ? 'linear-gradient(135deg, var(--secondary), #d4a373)' 
                              : 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1.2rem',
                            flexShrink: 0
                          }}>
                            {initialChar}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{u.name}</strong>
                              
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                background: u.role === 'admin' ? 'rgba(212, 163, 115, 0.2)' : u.role === 'coach' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 107, 82, 0.15)',
                                color: u.role === 'admin' ? 'var(--secondary)' : u.role === 'coach' ? '#f472b6' : 'var(--primary)',
                                border: u.role === 'admin' ? '1px solid rgba(212, 163, 115, 0.3)' : u.role === 'coach' ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(255, 107, 82, 0.3)'
                              }}>
                                {u.role === 'admin' ? 'مدیر سیستم' : u.role === 'coach' ? `مربی ورزشی (${u.coachCode || 'بدون کد'})` : 'ورزشکار'}
                              </span>

                              {isSelf && (
                                <span style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'var(--text-muted)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem'
                                }}>
                                  حساب شما
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span>نام کاربری: <code style={{ color: 'var(--text-main)' }}>@{u.username}</code></span>
                              {u.email && (
                                <span>ایمیل: <code style={{ color: 'var(--text-main)', direction: 'ltr' }}>{u.email}</code></span>
                              )}
                            </div>

                            {/* User Stats Pills */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                اندازه‌ها: <strong style={{ color: 'var(--text-main)' }}>{u.sizesCount ?? 0}</strong>
                              </span>
                              <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                برنامه‌ها: <strong style={{ color: 'var(--text-main)' }}>{u.programsCount ?? 0}</strong>
                              </span>
                              {u.role === 'coach' && (
                                <span style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', padding: '2px 6px', borderRadius: '4px' }}>
                                  شاگردان: <strong>{u.traineesCount ?? 0} نفر</strong>
                                </span>
                              )}
                              {u.coach && (
                                <span style={{ background: 'rgba(255, 107, 82, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>
                                  مربی: <strong>{u.coach.name}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          
                          {/* Role Selector Dropdown */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as 'admin' | 'coach' | 'user')}
                              disabled={changingRoleId === u.id || (isSelf && u.role === 'admin')}
                              className="input-field"
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                width: 'auto',
                                borderRadius: '8px',
                                background: '#181b24',
                                color: 'var(--text-main)',
                                cursor: 'pointer'
                              }}
                              title="تغییر نقش کاربر"
                            >
                              <option value="user">ورزشکار</option>
                              <option value="coach">مربی ورزشی 🏋️</option>
                              <option value="admin">مدیر سیستم 🛡️</option>
                            </select>
                          </div>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setNewPasswordVal('');
                              setResetError('');
                              setResetSuccess(false);
                            }}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              gap: '6px',
                              border: '1px solid var(--border)'
                            }}
                            title="تغییر رمز عبور"
                          >
                            <Lock size={14} />
                            <span>تغییر رمز</span>
                          </button>

                          {/* Delete Button */}
                          {!isSelf ? (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="btn btn-danger"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                gap: '4px'
                              }}
                              title="حذف کاربر"
                            >
                              <Trash2 size={14} />
                              <span>حذف</span>
                            </button>
                          ) : (
                            <span style={{
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <ShieldAlert size={14} />
                            </span>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: AI KEYS & PROVIDERS */}
        {/* ======================================================== */}
        {activeTab === 'ai' && (
          <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Key size={22} />
                  <span>تنظیم کلیدهای هوش مصنوعی (AI Providers)</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  پشتیبانی از چندین سرویس هوش مصنوعی برتر جهان با قابلیت تست زنده، پروکسی و تنظیم مدل
                </p>
              </div>

              {/* Status Badge */}
              <div style={{
                background: hasKey(activeProvider) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: hasKey(activeProvider) ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                color: hasKey(activeProvider) ? '#22c55e' : '#ef4444',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {hasKey(activeProvider) ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span>سرویس فعال: <strong>{activeProvider.toUpperCase()}</strong> ({hasKey(activeProvider) ? 'کلید فعال است' : 'فاقد کلید'})</span>
              </div>
            </div>

            {aiSaveSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: '#22c55e',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                <CheckCircle size={18} />
                <span>تنظیمات هوش مصنوعی با موفقیت در پایگاه داده ذخیره شد. تمام بخش‌های سایت بلافاصله از این تنظیمات استفاده می‌کنند.</span>
              </div>
            )}

            {aiError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                <AlertCircle size={18} />
                <span>{aiError}</span>
              </div>
            )}

            {/* Test Connection Result Alert */}
            {testResult && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: testResult.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: testResult.success ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: testResult.success ? '#22c55e' : '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                {testResult.success ? <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <div>
                  <strong>{testResult.success ? 'تست موفقیت‌آمیز بود:' : 'تست اتصال با خطا مواجه شد:'}</strong>
                  <p style={{ margin: '4px 0 0', lineHeight: '1.6' }}>{testResult.message || testResult.error}</p>
                </div>
              </div>
            )}

            {/* Active Provider Selector Tabs */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} style={{ color: 'var(--secondary)' }} />
                <span>انتخاب سرویس هوش مصنوعی فعال برای اپلیکیشن (تولید برنامه تمرینی و تحلیل بدن)</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'gemini', title: 'Google Gemini', desc: 'جمینای گوگل', badge: 'پیشنهادی' },
                  { id: 'openai', title: 'OpenAI (ChatGPT)', desc: 'مدل‌های جی‌پی‌تی', badge: 'GPT-4o' },
                  { id: 'deepseek', title: 'DeepSeek', desc: 'دیپ‌سیک قدرتمند', badge: 'مقرون‌به‌صرفه' },
                  { id: 'anthropic', title: 'Anthropic Claude', desc: 'کلود آنتروپیک', badge: 'تحلیلی' },
                  { id: 'openrouter', title: 'OpenRouter', desc: 'تمام مدل‌ها بدون تحریم', badge: 'آزاد' },
                ].map((item) => {
                  const isSelected = activeProvider === item.id;
                  const itemHasKey = hasKey(item.id as AiProvider);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveProvider(item.id as AiProvider)}
                      style={{
                        background: isSelected ? 'rgba(255, 107, 82, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative'
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <Check size={10} />
                        </div>
                      )}

                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </span>

                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: itemHasKey ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.06)',
                          color: itemHasKey ? '#22c55e' : 'var(--text-muted)'
                        }}>
                          {itemHasKey ? 'کلید ثبت‌شده' : 'بدون کلید'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveAi}>
              
              {/* ------------------------------------------------------------- */}
              {/* PROVIDER 1: GOOGLE GEMINI */}
              {/* ------------------------------------------------------------- */}
              <div style={{
                background: activeProvider === 'gemini' ? 'rgba(255, 107, 82, 0.04)' : 'rgba(255,255,255,0.01)',
                border: activeProvider === 'gemini' ? '1px solid rgba(255, 107, 82, 0.3)' : '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '1rem' }}>۱. تنظیمات Google Gemini</strong>
                    {activeProvider === 'gemini' && (
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>سرویس فعال</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestConnection('gemini')}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
                    disabled={testingProvider === 'gemini' || !geminiApiKey}
                  >
                    <RefreshCw size={13} style={{ animation: testingProvider === 'gemini' ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{testingProvider === 'gemini' ? 'در حال تست اتصال...' : 'تست اتصال زنده جمینای'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>کلید دسترسی (Gemini API Key)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showKey['gemini'] ? 'text' : 'password'}
                        className="input-field"
                        placeholder="AIzaSy..."
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left', paddingLeft: '38px' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility('gemini')}
                        style={{ position: 'absolute', left: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showKey['gemini'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>مدل پیش‌فرض</label>
                    <select
                      className="input-field"
                      value={geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value)}
                      style={{ background: '#181b24', color: 'white', direction: 'ltr' }}
                    >
                      {fetchedModels.length > 0 ? (
                        fetchedModels.map((m) => (
                          <option key={m.name} value={m.name.replace('models/', '')}>
                            {m.displayName} ({m.name})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="gemini-2.0-flash">gemini-2.0-flash (سریع و استاندارد)</option>
                          <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (بسیار سریع و سبک)</option>
                          <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro (دقیق و تحلیلی)</option>
                          <option value="gemini-2.5-pro-preview-05-06">gemini-2.5-pro (مدل استدلالی هوشمند)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    آدرس پایه سفارشی پروکسی (اختیاری - در صورت نیاز به دور زدن محدودیت‌های منطقه‌ای):
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://generativelanguage.googleapis.com یا آدرس Reverse Proxy شما"
                    value={geminiBaseUrl}
                    onChange={(e) => setGeminiBaseUrl(e.target.value)}
                    style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* PROVIDER 2: OPENAI */}
              {/* ------------------------------------------------------------- */}
              <div style={{
                background: activeProvider === 'openai' ? 'rgba(255, 107, 82, 0.04)' : 'rgba(255,255,255,0.01)',
                border: activeProvider === 'openai' ? '1px solid rgba(255, 107, 82, 0.3)' : '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} style={{ color: '#10a37f' }} />
                    <strong style={{ fontSize: '1rem' }}>۲. تنظیمات OpenAI (ChatGPT)</strong>
                    {activeProvider === 'openai' && (
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>سرویس فعال</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestConnection('openai')}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
                    disabled={testingProvider === 'openai' || !openaiApiKey}
                  >
                    <RefreshCw size={13} style={{ animation: testingProvider === 'openai' ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{testingProvider === 'openai' ? 'در حال تست...' : 'تست اتصال زنده OpenAI'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>کلید دسترسی (OpenAI API Key)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showKey['openai'] ? 'text' : 'password'}
                        className="input-field"
                        placeholder="sk-proj-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left', paddingLeft: '38px' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility('openai')}
                        style={{ position: 'absolute', left: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showKey['openai'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>مدل انتخابی</label>
                    <select
                      className="input-field"
                      value={openaiModel}
                      onChange={(e) => setOpenaiModel(e.target.value)}
                      style={{ background: '#181b24', color: 'white', direction: 'ltr' }}
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (سریع، ارزان و هوشمند)</option>
                      <option value="gpt-4o">gpt-4o (قدرتمندترین مدل چندوجهی)</option>
                      <option value="o3-mini">o3-mini (مدل استدلالی سبک)</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    آدرس Base URL (اختیاری - برای استفاده از سرویس‌های واسط مانند OneAPI، AvalAI یا پروکسی):
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://api.openai.com/v1"
                    value={openaiBaseUrl}
                    onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                    style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* PROVIDER 3: DEEPSEEK */}
              {/* ------------------------------------------------------------- */}
              <div style={{
                background: activeProvider === 'deepseek' ? 'rgba(255, 107, 82, 0.04)' : 'rgba(255,255,255,0.01)',
                border: activeProvider === 'deepseek' ? '1px solid rgba(255, 107, 82, 0.3)' : '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} style={{ color: '#3b82f6' }} />
                    <strong style={{ fontSize: '1rem' }}>۳. تنظیمات DeepSeek (دیپ‌سیک)</strong>
                    {activeProvider === 'deepseek' && (
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>سرویس فعال</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestConnection('deepseek')}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
                    disabled={testingProvider === 'deepseek' || !deepseekApiKey}
                  >
                    <RefreshCw size={13} style={{ animation: testingProvider === 'deepseek' ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{testingProvider === 'deepseek' ? 'در حال تست...' : 'تست اتصال زنده DeepSeek'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>کلید دسترسی (DeepSeek API Key)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showKey['deepseek'] ? 'text' : 'password'}
                        className="input-field"
                        placeholder="sk-..."
                        value={deepseekApiKey}
                        onChange={(e) => setDeepseekApiKey(e.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left', paddingLeft: '38px' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility('deepseek')}
                        style={{ position: 'absolute', left: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showKey['deepseek'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>مدل دیپ‌سیک</label>
                    <select
                      className="input-field"
                      value={deepseekModel}
                      onChange={(e) => setDeepseekModel(e.target.value)}
                      style={{ background: '#181b24', color: 'white', direction: 'ltr' }}
                    >
                      <option value="deepseek-chat">deepseek-chat (دیپ‌سیک V3 عمومی و سریع)</option>
                      <option value="deepseek-reasoner">deepseek-reasoner (دیپ‌سیک R1 استدلالی)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    آدرس Base URL (پیش‌فرض: https://api.deepseek.com):
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://api.deepseek.com"
                    value={deepseekBaseUrl}
                    onChange={(e) => setDeepseekBaseUrl(e.target.value)}
                    style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* PROVIDER 4 & 5: ANTHROPIC & OPENROUTER */}
              {/* ------------------------------------------------------------- */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                
                {/* Anthropic Claude */}
                <div style={{
                  background: activeProvider === 'anthropic' ? 'rgba(255, 107, 82, 0.04)' : 'rgba(255,255,255,0.01)',
                  border: activeProvider === 'anthropic' ? '1px solid rgba(255, 107, 82, 0.3)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#d97706' }}>۴. Anthropic (Claude)</strong>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('anthropic')}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      disabled={testingProvider === 'anthropic' || !anthropicApiKey}
                    >
                      {testingProvider === 'anthropic' ? 'در حال تست...' : 'تست اتصال'}
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Claude API Key</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="sk-ant-..."
                      value={anthropicApiKey}
                      onChange={(e) => setAnthropicApiKey(e.target.value)}
                      style={{ direction: 'ltr' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>مدل کلود</label>
                    <select
                      className="input-field"
                      value={anthropicModel}
                      onChange={(e) => setAnthropicModel(e.target.value)}
                      style={{ background: '#181b24', color: 'white', direction: 'ltr' }}
                    >
                      <option value="claude-3-5-haiku-20241022">claude-3-5-haiku</option>
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet</option>
                    </select>
                  </div>
                </div>

                {/* OpenRouter */}
                <div style={{
                  background: activeProvider === 'openrouter' ? 'rgba(255, 107, 82, 0.04)' : 'rgba(255,255,255,0.01)',
                  border: activeProvider === 'openrouter' ? '1px solid rgba(255, 107, 82, 0.3)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#a855f7' }}>۵. OpenRouter (تمام مدل‌ها)</strong>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('openrouter')}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      disabled={testingProvider === 'openrouter' || !openrouterApiKey}
                    >
                      {testingProvider === 'openrouter' ? 'در حال تست...' : 'تست اتصال'}
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>OpenRouter API Key</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="sk-or-..."
                      value={openrouterApiKey}
                      onChange={(e) => setOpenrouterApiKey(e.target.value)}
                      style={{ direction: 'ltr' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>مدل مورد نظر در OpenRouter</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="google/gemini-2.0-flash-001"
                      value={openrouterModel}
                      onChange={(e) => setOpenrouterModel(e.target.value)}
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                </div>

              </div>

              {/* Save All Settings Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '14px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '1rem' }}
                  disabled={aiSaving}
                >
                  <Sparkles size={18} />
                  <span>{aiSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تمام تنظیمات و کلیدهای هوش مصنوعی'}</span>
                </button>

                {aiSaveSuccess && (
                  <span style={{ color: '#22c55e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} />
                    <span>تغییرات ذخیره شد!</span>
                  </span>
                )}
              </div>

            </form>

            {/* Dynamic Gemini Rate Limits Section */}
            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', margin: 0 }}>
                  <Sparkles size={16} />
                  <span>استعلام نرخ و مدل‌های رسمی متصل به کلید گوگل شما (Gemini Rate Limits)</span>
                </h3>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
                  disabled={fetchingModels || !geminiApiKey}
                >
                  <RefreshCw 
                    size={13} 
                    style={{ animation: fetchingModels ? 'spin 1s linear infinite' : 'none' }} 
                  />
                  <span>{fetchingModels ? 'در حال استعلام...' : 'استعلام مدل‌های حساب گوگل'}</span>
                </button>
              </div>

              {fetchModelsError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginBottom: '14px'
                }}>
                  {fetchModelsError}
                </div>
              )}

              {fetchedModels.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxHeight: '280px', 
                  overflowY: 'auto', 
                  paddingLeft: '4px'
                }}>
                  {fetchedModels.map((m) => {
                    const isCurrent = geminiModel === m.name || geminiModel === m.name.replace('models/', '');
                    return (
                      <div key={m.name} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border)',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: isCurrent ? 'var(--primary)' : 'var(--text-main)' }}>
                            {m.displayName}
                          </strong>
                          <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', direction: 'ltr' }}>
                            {m.name}
                          </code>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            محدودیت رایگان: {m.rateLimits.rpm} | {m.rateLimits.tpm} | {m.rateLimits.rpd}
                          </span>
                        </div>

                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => setGeminiModel(m.name.replace('models/', ''))}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--primary)' }}
                          >
                            انتخاب به عنوان پیش‌فرض
                          </button>
                        ) : (
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>مدل فعال</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PRODUCTS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Add product form */}
            <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} />
                <span>افزودن محصول جدید به فروشگاه</span>
              </h2>

              {prodSuccess && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#22c55e',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={16} />
                  <span>محصول ورزشی جدید با موفقیت اضافه شد.</span>
                </div>
              )}

              {prodError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{prodError}</span>
                </div>
              )}

              <form onSubmit={handleAddProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>نام کالا</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="مثال: پودر پروتئین وی ۲ کیلویی"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>قیمت (تومان)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="مثال: 580000"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>دسته‌بندی محصول</label>
                    <select
                      className="input-field"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      style={{ background: '#181b24', color: 'white' }}
                    >
                      <option value="supplement">🥛 مکمل‌های بدنسازی</option>
                      <option value="clothing">👚 پوشاک ورزشی بانوان</option>
                      <option value="equipment">🏋️ تجهیزات باشگاهی و کش</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>آیکون/تصویر پیش‌فرض</label>
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
                      <option value="sport_bra">sport_bra (نیم‌تنه ورزشی)</option>
                      <option value="leggings">leggings (شلوار لگ)</option>
                      <option value="generic">generic (کالای ورزشی عمومی)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '14px', marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>توضیحات و مشخصات کالا</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="کیفیت کالا، نوع استفاده، طعم یا راهنمای سایز..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    style={{ resize: 'none' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.9rem' }}
                  disabled={prodAdding}
                >
                  <Plus size={16} />
                  <span>{prodAdding ? 'در حال افزودن...' : 'افزودن محصول به فروشگاه'}</span>
                </button>
              </form>
            </div>

            {/* List of current products */}
            <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>
                کالاهای فعال در فروشگاه ({products.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '4px' }}
                    >
                      <Trash2 size={13} />
                      <span>حذف کالا</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
