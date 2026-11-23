import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  TextInput,
  Platform,
  Dimensions,
  Switch,
  Modal
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ctgrfytplwtilorayuyn.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KKxMEZ7U0KAYV-Za8lU8gw_qgLcc79M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let WebView = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const dateKey = (date) => `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
const formatMonthLabel = (date) => date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase();

export default function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showAdminSelectionModal, setShowAdminSelectionModal] = useState(false);
  const [generalFirstName, setGeneralFirstName] = useState('');
  const [generalLastName, setGeneralLastName] = useState('');
  const [activeGeneralUsers, setActiveGeneralUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => setScreenData(result.window);
    const dimensionListener = Dimensions.addEventListener('change', onChange);
    return () => dimensionListener?.remove();
  }, []);

  const isDesktop = screenData.width >= 768;

  const getRoleDashboardItems = () => {
    if (currentRole === 'general') {
      return [
        { key: 'live', title: 'Transmisión en Vivo', subtitle: 'Sigue el culto y la palabra en directo', icon: '📺', color: '#2dd4bf' },
        { key: 'prayers', title: 'Red de Oración', subtitle: 'Publica y únete a peticiones de la hermandad', icon: '🙏', color: '#34d399' }
      ];
    }
    if (currentRole === 'tesorero') {
      return [
        { key: 'finance', title: 'Tesorería y Fondos', subtitle: 'Control de diezmos, ofrendas y finanzas', icon: '💰', color: '#2dd4bf' },
        { key: 'live', title: 'Transmisión en Vivo', subtitle: 'Visualiza la señal del culto actual', icon: '📺', color: '#34d399' },
        { key: 'comites', title: 'Comités de Trabajo', subtitle: 'Listado de comités de la iglesia', icon: '👥', color: '#fbbf24' },
        { key: 'services', title: 'Calendario de Cultos', subtitle: 'Consulta los eventos programados', icon: '📋', color: '#a78bfa' }
      ];
    }
    if (currentRole === 'secretario') {
      return [
        { key: 'live', title: 'Transmisión en Vivo', subtitle: 'Monitorea la señal del culto', icon: '📺', color: '#2dd4bf' },
        { key: 'comites', title: 'Comités de Trabajo', subtitle: 'Gestiona líderes y secretarios de comités', icon: '👥', color: '#34d399' },
        { key: 'services', title: 'Calendario de Cultos', subtitle: 'Programa y organiza los eventos y cultos', icon: '📋', color: '#fbbf24' },
        { key: 'finance', title: 'Tesorería (Visualización)', subtitle: 'Consulta los fondos y reportes financieros', icon: '💰', color: '#a78bfa' }
      ];
    }
    if (currentRole === 'lideres' || (!['pastor', 'secretario', 'tesorero', 'general'].includes(currentRole) && currentRole !== null)) {
      return [
        { key: 'live', title: 'Transmisión en Vivo', subtitle: 'Sigue el culto en directo', icon: '📺', color: '#2dd4bf' },
        { key: 'comites', title: 'Comités de Trabajo', subtitle: 'Consulta los comités y líderes de área', icon: '👥', color: '#fbbf24' },
        { key: 'prayers', title: 'Red de Oración', subtitle: 'Visualiza y participa en peticiones', icon: '🙏', color: '#34d399' },
        { key: 'services', title: 'Calendario de Cultos', subtitle: 'Consulta la agenda y eventos programados', icon: '📋', color: '#a78bfa' }
      ];
    }
    return [
      { key: 'live', title: 'Transmisión en Vivo', subtitle: 'Administra sedes y el reproductor en directo', icon: '📺', color: '#2dd4bf' },
      { key: 'prayers', title: 'Red de Oración', subtitle: 'Gestiona peticiones y marca respondidas', icon: '🙏', color: '#34d399' },
      { key: 'comites', title: 'Comités de Trabajo', subtitle: 'Organiza líderes, comités y secretarios', icon: '👥', color: '#fbbf24' },
      { key: 'finance', title: 'Tesorería y Fondos', subtitle: 'Administra fondos, ofrendas y cuentas', icon: '💰', color: '#a78bfa' },
      { key: 'services', title: 'Calendario de Cultos', subtitle: 'Planifica la agenda de servicios y eventos', icon: '📋', color: '#f472b6' },
      { key: 'users', title: 'Gestión de Accesos', subtitle: 'Modifica perfiles, visibilidad y claves', icon: '🔐', color: '#60a5fa' }
    ];
  };

  const dashboardItems = getRoleDashboardItems();

  const [sedesList, setSedesList] = useState([
    { id: '1', nombre: 'IPUC Mosquera Tercera', url: '', isLive: false }
  ]);
  const [selectedSede, setSelectedSede] = useState(sedesList[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newSedeName, setNewSedeName] = useState('');
  const [newSedeChannelUrl, setNewSedeChannelUrl] = useState('');
  const [newSedeIsLive, setNewSedeIsLive] = useState(false);

  const [prayers, setPrayers] = useState([]);
  const [newPrayerName, setNewPrayerName] = useState('');
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  
  const [editingPrayerId, setEditingPrayerId] = useState(null);
  const [editingPrayerText, setEditingPrayerText] = useState('');

  const [comitesList, setComitesList] = useState([]);
  const [showComiteForm, setShowComiteForm] = useState(false);
  const [editingComiteId, setEditingComiteId] = useState(null);
  const [newComiteName, setNewComiteName] = useState('');
  const [newComiteLider, setNewComiteLider] = useState('');
  const [newComiteSecretario, setNewComiteSecretario] = useState('');

  const [financeList, setFinanceList] = useState([]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [newFinanceLabel, setNewFinanceLabel] = useState('');
  const [newFinanceAmount, setNewFinanceAmount] = useState('');

  // Meses visibles: siempre comienzan en el mes local actual y el siguiente.
  const [activeMonths, setActiveMonths] = useState(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return [
      { id: monthKey(today), name: formatMonthLabel(today) },
      { id: monthKey(nextMonth), name: formatMonthLabel(nextMonth) }
    ];
  });
  const [currentMonth, setCurrentMonth] = useState(() => monthKey(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [showDayModal, setShowDayModal] = useState(false);

  const [eventsList, setEventsList] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDetails, setNewEventDetails] = useState('');

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const results = await Promise.all([
        supabase.from('sedes').select('*'),
        supabase.from('prayers').select('*').order('id', { ascending: false }),
        supabase.from('comites').select('*'),
        supabase.from('finance').select('*'),
        supabase.from('events').select('*').order('date', { ascending: true })
      ]);

      const labels = ['sedes', 'prayers', 'comites', 'finance', 'events'];
      results.forEach((result, index) => {
        if (result.error) throw new Error(`Error cargando ${labels[index]}: ${result.error.message}`);
      });

      const [sedesResult, prayersResult, comitesResult, financeResult, eventsResult] = results;
      const sedesData = sedesResult.data || [];
      const prayersData = prayersResult.data || [];
      const comitesData = comitesResult.data || [];
      const financeData = financeResult.data || [];
      const eventsData = eventsResult.data || [];

      const formattedSedes = sedesData.map(s => ({ ...s, id: String(s.id) }));
      setSedesList(formattedSedes);
      setSelectedSede(prev => formattedSedes.find(s => s.id === String(prev?.id)) || formattedSedes[0] || null);

      setPrayers(prayersData.map(p => ({
        ...p,
        status: p.status || 'active',
        count: p.count !== undefined ? p.count : 0
      })));

      setComitesList(comitesData.map(c => ({
        ...c,
        id: String(c.id),
        lider: c.lider || '',
        secretario: c.secretario || ''
      })));

      setFinanceList(financeData);
      setEventsList(eventsData);
    } catch (err) {
      console.error('Error de sincronización:', err);
      alert('No fue posible sincronizar toda la información. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setRefreshing(false);
    }
  };

  const formatMonthName = (yearMonthStr) => {
    const [year, month] = yearMonthStr.split('-');
    const monthsNames = {
      '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
      '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
      '09': 'SEPTIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
    };
    return `${monthsNames[month] || 'MES'} ${year}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncSession = async (session) => {
      if (!mounted) return;
      const user = session?.user || null;
      setCurrentUser(user);
      if (!user) { setCurrentProfile(null); setCurrentRole(null); return; }
      const { data, error } = await supabase.from('profiles').select('role, display_name').eq('id', user.id).single();
      if (!mounted) return;
      if (error || !data) { setCurrentProfile(null); setCurrentRole(null); return; }
      setCurrentProfile(data); setCurrentRole(data.role);
    };
    supabase.auth.getSession().then(({ data }) => syncSession(data.session)).catch(() => {});
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => Promise.resolve().then(() => syncSession(session)));
    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  }, []);

  const handleAdminLogin = async () => {
    if (!authEmail.trim() || !authPassword) { setAuthError('Ingresa tu correo y contraseña.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim().toLowerCase(), password: authPassword });
      if (error) throw error;
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('role, display_name').eq('id', data.user.id).single();
      if (profileError || !profileData) { await supabase.auth.signOut(); throw new Error('Esta cuenta aún no tiene un perfil administrativo habilitado. Contacta al administrador.'); }
      if (!['pastor', 'secretario', 'tesorero', 'lideres'].includes(profileData.role)) { await supabase.auth.signOut(); throw new Error('Esta cuenta no tiene permisos administrativos asignados.'); }
      setCurrentUser(data.user); setCurrentProfile(profileData); setCurrentRole(profileData.role); setActiveTab('home'); setAuthPassword(''); setShowAdminSelectionModal(false); fetchData();
    } catch (error) { setAuthError(error?.message || 'No fue posible iniciar sesión.'); }
    finally { setAuthLoading(false); }
  };

  const handleSignOut = async () => {
    if (currentUser) { const { error } = await supabase.auth.signOut(); if (error) alert('No fue posible cerrar sesión: ' + error.message); }
    setCurrentUser(null); setCurrentProfile(null); setCurrentRole(null); setActiveTab('home'); setAuthPassword(''); setAuthError('');
  };

  const handleGeneralLogin = () => {
    const firstNameClean = generalFirstName.trim();
    const lastNameClean = generalLastName.trim();

    if (!firstNameClean || !lastNameClean) {
      alert('⚠️ Por favor ingresa tu Primer Nombre y Primer Apellido para continuar.');
      return;
    }

    const fullNameKey = `${firstNameClean.toLowerCase()} ${lastNameClean.toLowerCase()}`;

    if (activeGeneralUsers.includes(fullNameKey)) {
      alert('⚠️ Ya existe un usuario activo con este mismo Nombre y Apellido. Por favor verifica tus datos.');
      return;
    }

    setActiveGeneralUsers(prev => [...prev, fullNameKey]);
    setCurrentRole('general');
    setActiveTab('home');
    setShowGeneralModal(false);
  };

  const handleSaveSede = async () => {
    if (['tesorero', 'general', 'lideres'].includes(currentRole)) return;
    const finalName = newSedeName.trim() || 'Nueva Sede';
    let finalUrl = newSedeChannelUrl.trim();

    if (finalUrl.includes('watch?v=')) {
      const videoId = finalUrl.split('v=')[1]?.split('&')[0];
      finalUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      finalUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const targetId = editingId ? String(editingId) : String(Date.now());
    const payload = { id: targetId, nombre: finalName, url: finalUrl, isLive: newSedeIsLive };

    setSedesList(prev => editingId ? prev.map(s => s.id === targetId ? payload : s) : [...prev, payload]);
    setSelectedSede(payload);

    const { error } = await supabase.from('sedes').upsert([payload]);
    if (error) alert('Error en BD: ' + error.message);
    else fetchData();

    setNewSedeName('');
    setNewSedeChannelUrl('');
    setNewSedeIsLive(false);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleDeleteSede = async (idToDelete) => {
    if (currentRole !== 'pastor') return;
    if (sedesList.length <= 1) return;
    const targetId = String(idToDelete);
    setSedesList(prev => prev.filter(s => s.id !== targetId));
    if (String(selectedSede?.id) === targetId) setSelectedSede(sedesList[0]);
    await supabase.from('sedes').delete().eq('id', targetId);
  };

  const addPrayer = async () => {
    if (newPrayerRequest.trim() === '') return;
    const newId = String(Date.now());
    
    const fullName = `${generalFirstName.trim()} ${generalLastName.trim()}`.trim();
    const authorName = currentRole === 'general' ? (fullName || 'Anónimo') : (newPrayerName.trim() || 'Líder');

    const newObj = { 
      id: newId, 
      name: authorName, 
      request: newPrayerRequest.trim(),
      status: 'active',
      count: 0
    };

    setPrayers(prev => [newObj, ...prev]);
    await supabase.from('prayers').insert([newObj]);
    setNewPrayerName('');
    setNewPrayerRequest('');
  };

  const handleSaveEditedPrayer = async (id) => {
    if (currentRole !== 'pastor' || !editingPrayerText.trim()) return;
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, request: editingPrayerText.trim() } : p));
    await supabase.from('prayers').update({ request: editingPrayerText.trim() }).eq('id', id);
    setEditingPrayerId(null);
    setEditingPrayerText('');
  };

  const handleSupportPrayer = async (item) => {
    const { data, error } = await supabase.rpc('increment_prayer_support', { p_prayer_id: String(item.id) });
    if (error) { alert('No fue posible registrar tu apoyo. Inténtalo de nuevo.'); return; }
    setPrayers(prev => prev.map(p => p.id === item.id ? { ...p, count: data } : p));
  };

  const togglePrayerStatus = async (item) => {
    if (['general', 'tesorero', 'secretario', 'lideres'].includes(currentRole)) return;
    const newStatus = item.status === 'answered' ? 'active' : 'answered';
    setPrayers(prev => prev.map(p => p.id === item.id ? { ...p, status: newStatus } : p));
    await supabase.from('prayers').update({ status: newStatus }).eq('id', item.id);
  };

  const handleDeletePrayer = async (id) => {
    if (currentRole !== 'pastor') return;
    setPrayers(prev => prev.filter(p => p.id !== String(id)));
    await supabase.from('prayers').delete().eq('id', String(id));
  };

  const handleSaveComite = async () => {
    if (currentRole !== 'pastor' && currentRole !== 'secretario') return;
    const payload = {
      id: editingComiteId ? String(editingComiteId) : String(Date.now()),
      nombre: newComiteName.trim() || 'Comité',
      lider: newComiteLider.trim(),
      secretario: newComiteSecretario.trim()
    };
    
    setComitesList(prev => editingComiteId ? prev.map(c => c.id === payload.id ? payload : c) : [...prev, payload]);
    await supabase.from('comites').upsert([payload]);
    
    setNewComiteName(''); 
    setNewComiteLider(''); 
    setNewComiteSecretario(''); 
    setEditingComiteId(null); 
    setShowComiteForm(false);
  };

  const handleDeleteComite = async (id) => {
    if (currentRole !== 'pastor' && currentRole !== 'secretario') return;
    setComitesList(prev => prev.filter(c => c.id !== String(id)));
    await supabase.from('comites').delete().eq('id', String(id));
  };

  const handleSaveFinance = async () => {
    if (currentRole !== 'pastor' && currentRole !== 'tesorero') return;
    const payload = {
      id: editingFinanceId ? String(editingFinanceId) : String(Date.now()),
      label: newFinanceLabel.trim() || 'Fondo',
      amount: newFinanceAmount.trim() || '$ 0.00',
      color: '#2dd4bf'
    };
    setFinanceList(prev => editingFinanceId ? prev.map(f => f.id === payload.id ? payload : f) : [...prev, payload]);
    await supabase.from('finance').upsert([payload]);
    setNewFinanceLabel(''); setNewFinanceAmount(''); setEditingFinanceId(null); setShowFinanceForm(false);
  };

  const handleDeleteFinance = async (id) => {
    if (currentRole !== 'pastor' && currentRole !== 'tesorero') return;
    if (financeList.length <= 1) return;
    setFinanceList(prev => prev.filter(f => f.id !== String(id)));
    await supabase.from('finance').delete().eq('id', String(id));
  };

  const handleSaveEvent = async () => {
    if (currentRole !== 'pastor' && currentRole !== 'secretario') return;
    if (!newEventTitle.trim()) return;

    const payload = {
      id: editingEventId ? String(editingEventId) : String(Date.now()),
      date: selectedDay,
      title: newEventTitle.trim(),
      time: newEventTime.trim() || '6:00 PM',
      details: newEventDetails.trim() || ''
    };

    setEventsList(prev => editingEventId ? prev.map(e => e.id === payload.id ? payload : e) : [...prev, payload]);
    await supabase.from('events').upsert([payload]);

    setNewEventTitle(''); 
    setNewEventTime(''); 
    setNewEventDetails(''); 
    setEditingEventId(null);
    setShowEventForm(false);
  };

  const handleDeleteEvent = async (id) => {
    if (currentRole !== 'pastor' && currentRole !== 'secretario') return;
    setEventsList(prev => prev.filter(e => e.id !== String(id)));
    await supabase.from('events').delete().eq('id', String(id));
  };

  // Construcción del calendario real alineado por día de la semana (Lunes a Domingo o Domingo a Sábado)
  const getCalendarMatrix = (yearMonthStr) => {
    const [year, month] = yearMonthStr.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Domingo, 1 = Lunes...
    const totalDays = new Date(year, month, 0).getDate();

    // Ajustamos para iniciar en Lunes (Lunes = 0, ..., Domingo = 6)
    const offset = (firstDayIndex + 6) % 7; 

    let matrix = [];
    let currentRow = Array(7).fill(null);

    // Rellenar espacios vacíos antes del día 1
    for (let i = 0; i < offset; i++) {
      currentRow[i] = null;
    }

    // Rellenar días del mes
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${yearMonthStr}-${dayStr}`;
      
      const colIndex = (offset + day - 1) % 7;
      currentRow[colIndex] = { dayNumber: day, dateString };

      if (colIndex === 6 || day === totalDays) {
        matrix.push(currentRow);
        currentRow = Array(7).fill(null);
      }
    }
    return matrix;
  };

  const calendarMatrix = getCalendarMatrix(currentMonth);

  const userDisplayName = currentProfile?.display_name || currentUser?.email || (generalFirstName && generalLastName ? `${generalFirstName} ${generalLastName}` : 'Invitado');

  if (!currentRole) {
    return (
      <SafeAreaView style={styles.welcomeContainer}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>🏛️</Text>
          <Text style={styles.welcomeTitle}>IPUC Líderes</Text>
          <Text style={styles.welcomeSubtitle}>Selecciona tu modo de ingreso para continuar</Text>

          <TouchableOpacity 
            style={styles.welcomePublicBtn} 
            onPress={() => { setGeneralFirstName(''); setGeneralLastName(''); setShowGeneralModal(true); }}
          >
            <Text style={styles.welcomePublicBtnText}>🌐 Ingresar a la Congregación</Text>
            <Text style={styles.welcomePublicBtnSub}>Transmisión y Red de Oración (Sin contraseña)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.welcomeAdminBtn} 
            onPress={() => { setAuthEmail(''); setAuthPassword(''); setAuthError(''); setShowAdminSelectionModal(true); }}
          >
            <Text style={styles.welcomeAdminBtnText}>🔐 Accesos Administrativos</Text>
            <Text style={styles.welcomeAdminBtnSub}>Pastor, Secretario(a), Tesorero(a) y Líderes</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showGeneralModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>👋 ¡Bienvenido a la Congregación!</Text>
              <Text style={styles.modalSub}>Ingresa tus datos personales para identificarte:</Text>
              
              <TextInput 
                style={styles.input} 
                placeholder="Primer Nombre *" 
                placeholderTextColor="#666" 
                value={generalFirstName} 
                onChangeText={setGeneralFirstName} 
                autoFocus
              />

              <TextInput 
                style={styles.input} 
                placeholder="Primer Apellido *" 
                placeholderTextColor="#666" 
                value={generalLastName} 
                onChangeText={setGeneralLastName} 
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#344256', flex: 1 }]} 
                  onPress={() => setShowGeneralModal(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { flex: 1 }]} 
                  onPress={handleGeneralLogin}
                >
                  <Text style={styles.actionBtnText}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showAdminSelectionModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Acceso administrativo</Text>
              <Text style={styles.modalSub}>Ingresa con tu cuenta personal autorizada.</Text>
              <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#8492a6" value={authEmail}
                onChangeText={(value) => { setAuthEmail(value); setAuthError(''); }} keyboardType="email-address" autoCapitalize="none"
                autoComplete="email" textContentType="emailAddress" autoFocus />
              <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#8492a6" value={authPassword}
                onChangeText={(value) => { setAuthPassword(value); setAuthError(''); }} secureTextEntry autoCapitalize="none"
                autoComplete="password" textContentType="password" onSubmitEditing={handleAdminLogin} />
              {!!authError && <Text style={styles.authErrorText}>{authError}</Text>}
              <TouchableOpacity style={[styles.actionBtn, authLoading && { opacity: 0.6 }]} onPress={handleAdminLogin} disabled={authLoading}>
                <Text style={styles.actionBtnText}>{authLoading ? 'Verificando acceso…' : 'Ingresar de forma segura'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.forgotPasswordBtn} onPress={async () => {
                if (!authEmail.trim()) { setAuthError('Escribe tu correo para enviarte el enlace de recuperación.'); return; }
                setAuthLoading(true);
                const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim().toLowerCase(), { redirectTo: 'https://ipuc-lideres.vercel.app' });
                setAuthLoading(false); setAuthError(error ? error.message : 'Si la cuenta existe, recibirás un enlace de recuperación.');
              }} disabled={authLoading}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#26364b', marginTop: 8 }]}
                onPress={() => { setShowAdminSelectionModal(false); setAuthError(''); setAuthPassword(''); }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const roleLabels = { pastor: 'Pastor', secretario: 'Secretaría', tesorero: 'Tesorería', lideres: 'Líderes', general: 'Congregación' };
  const currentRoleObj = currentRole ? { name: roleLabels[currentRole] || currentRole } : null;

  return (
    <SafeAreaView style={styles.container}>
      {!isProjectorMode && (
        <View style={styles.topBarContainer}>
          <View style={styles.roleSelectorWrapper}>
            <TouchableOpacity style={styles.roleButtonActive} onPress={handleSignOut}>
              <Text style={styles.roleButtonText}>
                👤 {currentRoleObj ? currentRoleObj.name : userDisplayName} (Salir ⇦)
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab !== 'home' && (
            <TouchableOpacity style={styles.homeNavBtn} onPress={() => setActiveTab('home')}>
              <Text style={styles.homeNavBtnText}>🏠 Inicio</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} disabled={refreshing}>
            <Text style={styles.refreshBtnText}>{refreshing ? '⏳' : '🔄'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
        <View style={{ flex: 1, width: '100%' }}>

          {activeTab === 'home' && (
            <ScrollView style={styles.content}>
              <View style={styles.dashboardWelcomeCard}>
                <Text style={styles.dashboardWelcomeEmoji}>✨</Text>
                <Text style={styles.dashboardWelcomeTitle}>
                  Bienvenido, {currentRoleObj ? currentRoleObj.name : userDisplayName}
                </Text>
                <Text style={styles.dashboardWelcomeSub}>Selecciona una opción para acceder a sus funciones:</Text>
              </View>

              <View style={[styles.dashboardGrid, isDesktop && styles.desktopDashboardGrid]}>
                {dashboardItems.map((item) => (
                  <TouchableOpacity 
                    key={item.key} 
                    style={[styles.dashboardCard, isDesktop && { width: '31%' }]} 
                    onPress={() => setActiveTab(item.key)}
                  >
                    <Text style={styles.dashboardCardIcon}>{item.icon}</Text>
                    <Text style={[styles.dashboardCardTitle, { color: item.color }]}>{item.title}</Text>
                    <Text style={styles.dashboardCardSub}>{item.subtitle}</Text>
                    <Text style={styles.dashboardCardArrow}>Entrar ➔</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
          
          {activeTab === 'live' && (
            <ScrollView style={[styles.content, isProjectorMode && { padding: 0, backgroundColor: '#000' }]}>
              
              {!isProjectorMode && (
                <>
                  <View style={styles.sedesHeaderRow}>
                    <Text style={styles.labelHeader}>Sedes Registradas:</Text>
                    {selectedSede && (currentRole === 'pastor' || currentRole === 'secretario') && (
                      <TouchableOpacity onPress={() => { 
                        setEditingId(selectedSede.id); 
                        setNewSedeName(selectedSede.nombre); 
                        setNewSedeChannelUrl(selectedSede.url); 
                        setNewSedeIsLive(selectedSede.isLive || false);
                        setShowAddForm(true); 
                      }}>
                        <Text style={styles.editSedeText}>✏️ Modificar Sede Actual</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {sedesList.map((item) => (
                      <View key={item.id} style={styles.sedeChipWrapper}>
                        <TouchableOpacity style={[styles.sedeChip, String(selectedSede?.id) === String(item.id) && styles.activeSedeChip]} onPress={() => setSelectedSede(item)}>
                          <Text style={[styles.sedeChipText, String(selectedSede?.id) === String(item.id) && styles.activeSedeChipText]}>
                            🏛️ {item.nombre} {item.isLive ? '🔴' : ''}
                          </Text>
                        </TouchableOpacity>
                        {sedesList.length > 1 && currentRole === 'pastor' && (
                          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSede(item.id)}>
                            <Text style={styles.deleteBtnText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>{selectedSede?.nombre || 'Sede'}</Text>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {selectedSede?.isLive ? (
                        <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>🔴 EN DIRECTO</Text></View>
                      ) : (
                        <View style={styles.offlineBadge}><Text style={styles.offlineBadgeText}>⚪ OFFLINE</Text></View>
                      )}
                      
                      <TouchableOpacity style={styles.projectorToggleBtn} onPress={() => setIsProjectorMode(true)}>
                        <Text style={styles.projectorToggleText}>🖥️ Modo Proyector</Text>
                      </TouchableOpacity>
                    </div>
                  </View>
                </>
              )}

              <View style={[
                styles.videoContainer, 
                isDesktop && styles.desktopVideoContainer,
                isProjectorMode && styles.fullScreenProjectorContainer
              ]}>
                {selectedSede?.url ? (
                  Platform.OS === 'web' ? (
                    <iframe width="100%" height="100%" src={selectedSede.url} frameBorder="0" allowFullScreen />
                  ) : (
                    WebView && <WebView style={{ flex: 1 }} source={{ uri: selectedSede.url }} />
                  )
                ) : (
                  <View style={styles.emptyVideoBox}>
                    <Text style={styles.emptyVideoText}>⚠️ No hay URL de transmisión configurada.</Text>
                  </View>
                )}

                {isProjectorMode && (
                  <TouchableOpacity style={styles.exitProjectorBtn} onPress={() => setIsProjectorMode(false)}>
                    <Text style={styles.exitProjectorText}>✖ Salir de Modo Proyector</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!isProjectorMode && (currentRole === 'pastor' || currentRole === 'secretario') && (
                <>
                  <TouchableOpacity style={styles.addSedeToggleBtn} onPress={() => {
                    setEditingId(null);
                    setNewSedeName('');
                    setNewSedeChannelUrl('');
                    setNewSedeIsLive(false);
                    setShowAddForm(!showAddForm);
                  }}>
                    <Text style={styles.addSedeToggleText}>{showAddForm ? '❌ Cancelar' : '➕ Registrar Nueva Sede'}</Text>
                  </TouchableOpacity>

                  {showAddForm && (
                    <View style={styles.addSedeCard}>
                      <TextInput style={styles.input} placeholder="Nombre de la Sede" placeholderTextColor="#666" value={newSedeName} onChangeText={setNewSedeName} />
                      <TextInput style={styles.input} placeholder="URL de YouTube" placeholderTextColor="#666" value={newSedeChannelUrl} onChangeText={setNewSedeChannelUrl} />
                      
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>¿Está en Transmisión En Vivo?</Text>
                        <Switch
                          trackColor={{ false: '#344256', true: '#2dd4bf' }}
                          thumbColor={newSedeIsLive ? '#0f172a' : '#9ca3af'}
                          onValueChange={setNewSedeIsLive}
                          value={newSedeIsLive}
                        />
                      </View>

                      <TouchableOpacity style={styles.actionBtn} onPress={handleSaveSede}>
                        <Text style={styles.actionBtnText}>Guardar en Base de Datos</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}

          {activeTab === 'prayers' && currentRole !== 'tesorero' && currentRole !== 'secretario' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>🙏 Red de Oración Congregacional</Text>
              
              <View style={styles.addSedeCard}>
                {currentRole !== 'general' && currentRole !== 'lideres' && (
                  <TextInput style={styles.input} placeholder="Tu Nombre (Opcional)" placeholderTextColor="#666" value={newPrayerName} onChangeText={setNewPrayerName} />
                )}
                <TextInput style={[styles.input, { height: 80 }]} placeholder="Escribe tu motivo de oración..." placeholderTextColor="#666" multiline value={newPrayerRequest} onChangeText={setNewPrayerRequest} />
                <TouchableOpacity style={styles.actionBtn} onPress={addPrayer}>
                  <Text style={styles.actionBtnText}>Publicar Petición</Text>
                </TouchableOpacity>
              </View>

              {prayers.map(p => {
                const isMyPrayer = false;
                const isEditingThis = editingPrayerId === p.id;

                return (
                  <View key={p.id} style={[styles.card, p.status === 'answered' && styles.answeredCard]}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.cardTitle}>{p.name}</Text>
                        {p.status === 'answered' ? (
                          <View style={styles.answeredBadge}><Text style={styles.answeredBadgeText}>✨ RESPONDIDA</Text></View>
                        ) : (
                          <View style={styles.activePrayerBadge}><Text style={styles.activePrayerBadgeText}>🟡 EN ORACIÓN</Text></View>
                        )}
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {(currentRole === 'pastor' || isMyPrayer) && !isEditingThis && (
                          <TouchableOpacity onPress={() => { setEditingPrayerId(p.id); setEditingPrayerText(p.request); }}>
                            <Text style={{ color: '#2dd4bf', fontWeight: 'bold', fontSize: 12 }}>✏️ Editar</Text>
                          </TouchableOpacity>
                        )}
                        {(currentRole === 'pastor' || isMyPrayer) && (
                          <TouchableOpacity onPress={() => handleDeletePrayer(p.id)}>
                            <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {isEditingThis ? (
                      <View style={{ marginTop: 8 }}>
                        <TextInput 
                          style={[styles.input, { height: 70, marginBottom: 6 }]} 
                          value={editingPrayerText} 
                          onChangeText={setEditingPrayerText} 
                          multiline 
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#344256', flex: 1, padding: 8 }]} 
                            onPress={() => setEditingPrayerId(null)}
                          >
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionBtn, { flex: 1, padding: 8 }]} 
                            onPress={() => handleSaveEditedPrayer(p.id)}
                          >
                            <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: 'bold' }}>Guardar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.cardSub}>{p.request}</Text>
                    )}
                    
                    <View style={styles.prayerActionRow}>
                      <TouchableOpacity style={styles.supportBtn} onPress={() => handleSupportPrayer(p)}>
                        <Text style={styles.supportBtnText}>🙏 Me uno en oración ({p.count || 0})</Text>
                      </TouchableOpacity>
                      
                      {currentRole === 'pastor' && (
                        <TouchableOpacity style={styles.statusToggleBtn} onPress={() => togglePrayerStatus(p)}>
                          <Text style={styles.statusToggleText}>
                            {p.status === 'answered' ? '🔄 Marcar en Oración' : '✅ Marcar Respondida'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {activeTab === 'comites' && currentRole !== 'general' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>👥 Comités de Trabajo</Text>
              
              {comitesList.map(comite => (
                <View key={comite.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>🏛️ {comite.nombre}</Text>
                    {(currentRole === 'pastor' || currentRole === 'secretario') && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity 
                          style={{ marginRight: 12 }}
                          onPress={() => {
                            setEditingComiteId(comite.id);
                            setNewComiteName(comite.nombre);
                            setNewComiteLider(comite.lider);
                            setNewComiteSecretario(comite.secretario);
                            setShowComiteForm(true);
                          }}
                        >
                          <Text style={{ color: '#2dd4bf', fontWeight: 'bold' }}>✏️ Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteComite(comite.id)}>
                          <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕ Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View style={{ marginTop: 8, backgroundColor: '#202d40', padding: 10, borderRadius: 8 }}>
                    <Text style={styles.cardSub}>👤 <Text style={{ fontWeight: 'bold', color: '#2dd4bf' }}>1. Líder:</Text> {comite.lider || 'No asignado'}</Text>
                    <Text style={[styles.cardSub, { marginTop: 4 }]}>📝 <Text style={{ fontWeight: 'bold', color: '#2dd4bf' }}>2. Secretario:</Text> {comite.secretario || 'No asignado'}</Text>
                  </View>
                </View>
              ))}

              {(currentRole === 'pastor' || currentRole === 'secretario') && (
                <>
                  <TouchableOpacity style={styles.addSedeToggleBtn} onPress={() => {
                    setEditingComiteId(null);
                    setNewComiteName('');
                    setNewComiteLider('');
                    setNewComiteSecretario('');
                    setShowComiteForm(!showComiteForm);
                  }}>
                    <Text style={styles.addSedeToggleText}>{showComiteForm ? '❌ Cancelar' : '➕ Crear Nuevo Comité'}</Text>
                  </TouchableOpacity>

                  {showComiteForm && (
                    <View style={styles.addSedeCard}>
                      <TextInput style={styles.input} placeholder="Nombre del Comité" placeholderTextColor="#666" value={newComiteName} onChangeText={setNewComiteName} />
                      <TextInput style={styles.input} placeholder="1. Nombre del Líder" placeholderTextColor="#666" value={newComiteLider} onChangeText={setNewComiteLider} />
                      <TextInput style={styles.input} placeholder="2. Nombre del Secretario" placeholderTextColor="#666" value={newComiteSecretario} onChangeText={setNewComiteSecretario} />
                      <TouchableOpacity style={styles.actionBtn} onPress={handleSaveComite}>
                        <Text style={styles.actionBtnText}>{editingComiteId ? 'Actualizar Comité' : 'Guardar Comité'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}

          {activeTab === 'finance' && currentRole !== 'general' && currentRole !== 'lideres' && (
            <ScrollView style={styles.content}>
              <Text style={styles.centeredSectionTitle}>Diezmos - Ofrendas y Donaciones</Text>
              
              {currentRole === 'secretario' && (
                <View style={{ backgroundColor: '#202d40', padding: 8, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fbbf24', fontSize: 12 }}>👁️ Modo Solo Visualización (Secretaría)</Text>
                </View>
              )}

              <View style={styles.metricContainer}>
                {financeList.map(item => (
                  <View key={item.id} style={[styles.metricCard, isDesktop && { width: '32%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.metricLabel}>{item.label}</Text>
                      {(currentRole === 'pastor' || currentRole === 'tesorero') && financeList.length > 1 && (
                        <TouchableOpacity onPress={() => handleDeleteFinance(item.id)}>
                          <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[styles.metricValue, { color: item.color || '#2dd4bf' }]}>{item.amount}</Text>
                  </View>
                ))}
              </View>

              {(currentRole === 'pastor' || currentRole === 'tesorero') && (
                <>
                  <TouchableOpacity style={styles.addSedeToggleBtn} onPress={() => setShowFinanceForm(!showFinanceForm)}>
                    <Text style={styles.addSedeToggleText}>{showFinanceForm ? '❌ Cancelar' : '➕ Crear Nuevo Fondo'}</Text>
                  </TouchableOpacity>
                  {showFinanceForm && (
                    <View style={styles.addSedeCard}>
                      <TextInput style={styles.input} placeholder="Nombre del Fondo" placeholderTextColor="#666" value={newFinanceLabel} onChangeText={setNewFinanceLabel} />
                      <TextInput style={styles.input} placeholder="Monto (Ej: $ 150,000)" placeholderTextColor="#666" value={newFinanceAmount} onChangeText={setNewFinanceAmount} />
                      <TouchableOpacity style={styles.actionBtn} onPress={handleSaveFinance}>
                        <Text style={styles.actionBtnText}>Guardar Fondo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}

          {activeTab === 'services' && currentRole !== 'general' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>📅 Calendario de Cultos</Text>

              {/* Pestañas de meses */}
              <View style={styles.monthSelectorRow}>
                {activeMonths.map((m) => (
                  <TouchableOpacity 
                    key={m.id}
                    style={[styles.monthTabBtn, currentMonth === m.id && styles.activeMonthTab]} 
                    onPress={() => setCurrentMonth(m.id)}
                  >
                    <Text style={[styles.monthTabText, currentMonth === m.id && styles.activeMonthTabText]}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Calendario Estilo Cuadrícula Mensual */}
              <View style={styles.calendarContainerCard}>
                {/* Cabecera de días de la semana */}
                <View style={styles.weekDaysHeaderRow}>
                  <Text style={styles.weekDayLabel}>L</Text>
                  <Text style={styles.weekDayLabel}>M</Text>
                  <Text style={styles.weekDayLabel}>M</Text>
                  <Text style={styles.weekDayLabel}>J</Text>
                  <Text style={styles.weekDayLabel}>V</Text>
                  <Text style={styles.weekDayLabel}>S</Text>
                  <Text style={styles.weekDayLabel}>D</Text>
                </View>

                {/* Filas de la matriz del mes */}
                {calendarMatrix.map((weekRow, rowIndex) => (
                  <View key={rowIndex} style={styles.calendarWeekRow}>
                    {weekRow.map((dayObj, colIndex) => {
                      if (!dayObj) {
                        return <View key={`empty-${colIndex}`} style={styles.calendarCellEmpty} />;
                      }

                      const dayEvents = eventsList.filter(e => e.date === dayObj.dateString);
                      const hasEvent = dayEvents.length > 0;
                      const isSelected = selectedDay === dayObj.dateString;

                      return (
                        <TouchableOpacity 
                          key={dayObj.dateString} 
                          style={[
                            styles.calendarCell, 
                            hasEvent && styles.cellWithEvent,
                            isSelected && styles.cellSelected
                          ]} 
                          onPress={() => {
                            setSelectedDay(dayObj.dateString);
                            setShowDayModal(true);
                          }}
                        >
                          <Text style={[styles.cellDayNumber, isSelected && styles.cellDayNumberSelected]}>
                            {dayObj.dayNumber}
                          </Text>
                          {hasEvent && (
                            <View style={styles.cellEventIndicator}>
                              <Text style={styles.cellEventIndicatorText}>{dayEvents.length}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              <Text style={{ color: '#9ca3af', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
                💡 Toca cualquier día del calendario para ver o programar sus eventos.
              </Text>

              {/* Modal Desplegable del Día Seleccionado */}
              <Modal visible={showDayModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.modalTitle}>📅 Eventos del {selectedDay}</Text>
                      <TouchableOpacity onPress={() => setShowDayModal(false)}>
                        <Text style={{ color: '#ff0055', fontWeight: 'bold', fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ marginVertical: 10 }}>
                      {(currentRole === 'pastor' || currentRole === 'secretario') && (
                        <TouchableOpacity 
                          style={[styles.addSedeToggleBtn, { marginBottom: 12 }]} 
                          onPress={() => {
                            setEditingEventId(null);
                            setNewEventTitle('');
                            setNewEventTime('');
                            setNewEventDetails('');
                            setShowEventForm(!showEventForm);
                          }}
                        >
                          <Text style={styles.addSedeToggleText}>{showEventForm ? '✕ Cancelar' : '➕ Agregar Evento en este Día'}</Text>
                        </TouchableOpacity>
                      )}

                      {showEventForm && (currentRole === 'pastor' || currentRole === 'secretario') && (
                        <View style={styles.addSedeCard}>
                          <TextInput style={styles.input} placeholder="Título del Evento" placeholderTextColor="#666" value={newEventTitle} onChangeText={setNewEventTitle} />
                          <TextInput style={styles.input} placeholder="Hora (Ej: 7:00 PM)" placeholderTextColor="#666" value={newEventTime} onChangeText={setNewEventTime} />
                          <TextInput style={styles.input} placeholder="Detalles" placeholderTextColor="#666" value={newEventDetails} onChangeText={setNewEventDetails} />
                          <TouchableOpacity style={styles.actionBtn} onPress={handleSaveEvent}>
                            <Text style={styles.actionBtnText}>{editingEventId ? 'Actualizar Evento' : 'Guardar Evento'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {eventsList.filter(e => e.date === selectedDay).length > 0 ? (
                        eventsList.filter(e => e.date === selectedDay).map(ev => (
                          <View key={ev.id} style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                              <Text style={styles.cardTitle}>⏰ {ev.time} - {ev.title}</Text>
                              {(currentRole === 'pastor' || currentRole === 'secretario') && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <TouchableOpacity 
                                    style={{ marginRight: 12 }}
                                    onPress={() => {
                                      setEditingEventId(ev.id);
                                      setNewEventTitle(ev.title);
                                      setNewEventTime(ev.time);
                                      setNewEventDetails(ev.details);
                                      setShowEventForm(true);
                                    }}
                                  >
                                    <Text style={{ color: '#2dd4bf', fontWeight: 'bold' }}>✏️ Editar</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleDeleteEvent(ev.id)}>
                                    <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                            <Text style={styles.cardSub}>{ev.details}</Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.card}>
                          <Text style={[styles.cardSub, { textAlign: 'center' }]}>No hay eventos programados para este día.</Text>
                        </View>
                      )}
                    </ScrollView>

                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#344256', marginTop: 10 }]} 
                      onPress={() => setShowDayModal(false)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

            </ScrollView>
          )}



        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  
  welcomeContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  welcomeCard: { backgroundColor: '#142235', width: '100%', maxWidth: 460, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: '#31506a', alignItems: 'center', shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  welcomeEmoji: { fontSize: 46, marginBottom: 14 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3, color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 13, lineHeight: 20, color: '#aab8c8', textAlign: 'center', marginBottom: 26, maxWidth: 320 },
  
  welcomePublicBtn: { backgroundColor: '#2dd4bf', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  welcomePublicBtnText: { color: '#0f172a', fontSize: 15, fontWeight: 'bold' },
  welcomePublicBtnSub: { color: '#0f172a', fontSize: 11, fontWeight: '600', opacity: 0.8, marginTop: 2 },
  
  welcomeAdminBtn: { backgroundColor: '#202d40', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#344256' },
  welcomeAdminBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  welcomeAdminBtnSub: { color: '#9ca3af', fontSize: 11, fontWeight: '500', marginTop: 2 },

  adminRoleBtnInside: { backgroundColor: '#202d40', padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#344256' },
  adminRoleTextInside: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#142235', width: '100%', maxWidth: 390, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#31506a' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  modalSub: { fontSize: 12, lineHeight: 18, color: '#aab8c8', marginBottom: 16 },
  authErrorText: { color: '#fca5a5', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  forgotPasswordBtn: { alignItems: 'center', paddingVertical: 12 },
  forgotPasswordText: { color: '#65d6c8', fontSize: 12, fontWeight: '700' },

  topBarContainer: { flexDirection: 'row', backgroundColor: '#172033', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 56, borderBottomWidth: 1, borderColor: '#202d40', zIndex: 10 },
  roleSelectorWrapper: { marginRight: 6 },
  roleButtonActive: { backgroundColor: '#202d40', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2dd4bf' },
  roleButtonText: { color: '#2dd4bf', fontSize: 11, fontWeight: 'bold' },
  
  homeNavBtn: { backgroundColor: '#202d40', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#344256', marginRight: 6 },
  homeNavBtnText: { color: '#2dd4bf', fontSize: 12, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#202d40', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#344256' },
  refreshBtnText: { color: '#2dd4bf', fontSize: 13, fontWeight: 'bold' },

  mainWrapper: { flex: 1 },
  desktopWrapper: { maxWidth: 1024, alignSelf: 'center', width: '100%' },
  content: { flex: 1, padding: 16 },

  dashboardWelcomeCard: { backgroundColor: '#172033', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#202d40', alignItems: 'center' },
  dashboardWelcomeEmoji: { fontSize: 32, marginBottom: 6 },
  dashboardWelcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
  dashboardWelcomeSub: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  dashboardGrid: { gap: 12 },
  desktopDashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dashboardCard: { backgroundColor: '#172033', padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#202d40' },
  dashboardCardIcon: { fontSize: 26, marginBottom: 8 },
  dashboardCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  dashboardCardSub: { fontSize: 12, color: '#9ca3af', marginBottom: 12, lineHeight: 16 },
  dashboardCardArrow: { fontSize: 12, fontWeight: 'bold', color: '#2dd4bf' },

  sedesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelHeader: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af' },
  editSedeText: { fontSize: 12, fontWeight: 'bold', color: '#2dd4bf' },
  sedeChipWrapper: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  sedeChip: { backgroundColor: '#202d40', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#344256' },
  activeSedeChip: { backgroundColor: '#2dd4bf', borderColor: '#2dd4bf' },
  sedeChipText: { fontSize: 13, color: '#d1d5db' },
  activeSedeChipText: { color: '#0f172a', fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#ff0055', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: -6, marginTop: -10, zIndex: 2 },
  deleteBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  centeredSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  liveBadge: { backgroundColor: '#3f0d12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ff0055' },
  liveBadgeText: { color: '#ff3366', fontSize: 11, fontWeight: 'bold' },
  offlineBadge: { backgroundColor: '#202d40', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#344256' },
  offlineBadgeText: { color: '#9ca3af', fontSize: 11, fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202d40', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#344256', marginBottom: 12 },
  switchRowInside: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202d40', padding: 8, borderRadius: 8, marginVertical: 8 },
  switchLabel: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  videoContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#202d40' },
  desktopVideoContainer: { height: 380 },
  fullScreenProjectorContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', zIndex: 9999, borderRadius: 0, borderWidth: 0 },
  projectorToggleBtn: { backgroundColor: '#202d40', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#2dd4bf' },
  projectorToggleText: { color: '#2dd4bf', fontSize: 11, fontWeight: 'bold' },
  exitProjectorBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255, 0, 85, 0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, zIndex: 10000 },
  exitProjectorText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyVideoBox: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyVideoText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  addSedeToggleBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#2dd4bf', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#172033' },
  addSedeToggleText: { color: '#2dd4bf', fontWeight: 'bold', fontSize: 13 },
  addSedeCard: { backgroundColor: '#172033', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderColor: '#2dd4bf' },
  card: { backgroundColor: '#172033', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#202d40' },
  answeredCard: { borderColor: '#2dd4bf', backgroundColor: '#0b1f1a' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginRight: 8 },
  cardSub: { fontSize: 13, color: '#d1d5db', marginTop: 4, lineHeight: 18 },
  input: { backgroundColor: '#202d40', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#344256', marginBottom: 8, color: '#ffffff', fontSize: 14 },
  actionBtn: { backgroundColor: '#2dd4bf', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  actionBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 14 },
  metricContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  metricCard: { width: '48%', backgroundColor: '#172033', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#202d40', marginBottom: 10 },
  metricLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  metricValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  
  monthSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  monthTabBtn: { flex: 1, backgroundColor: '#202d40', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#344256' },
  activeMonthTab: { backgroundColor: '#2dd4bf', borderColor: '#2dd4bf' },
  monthTabText: { color: '#d1d5db', fontWeight: 'bold', fontSize: 13 },
  activeMonthTabText: { color: '#0f172a' },

  // Estilos avanzados para el nuevo Calendario en Cuadrícula Mensual
  calendarContainerCard: { backgroundColor: '#172033', borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: '#202d40' },
  weekDaysHeaderRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderColor: '#344256' },
  weekDayLabel: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', width: '14%', textAlign: 'center' },
  calendarWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calendarCellEmpty: { width: '14%', aspectRatio: 1 },
  calendarCell: { width: '14%', aspectRatio: 1, backgroundColor: '#202d40', justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#344256' },
  cellWithEvent: { borderColor: '#2dd4bf', backgroundColor: '#0b1f1a' },
  cellSelected: { backgroundColor: '#2dd4bf', borderColor: '#2dd4bf' },
  cellDayNumber: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  cellDayNumberSelected: { color: '#0f172a' },
  cellEventIndicator: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#ff0055', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  cellEventIndicatorText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  activePrayerBadge: { backgroundColor: '#344256', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activePrayerBadgeText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  answeredBadge: { backgroundColor: '#064e3b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  answeredBadgeText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  prayerActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderColor: '#202d40' },
  supportBtn: { backgroundColor: '#202d40', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#344256' },
  supportBtnText: { color: '#2dd4bf', fontSize: 12, fontWeight: 'bold' },
  statusToggleBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  statusToggleText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' }
});