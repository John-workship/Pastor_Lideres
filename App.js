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
  Switch 
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ctgrfytplwtilorayuyn.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KKxMEZ7U0KAYV-Za8lU8gw_qgLcc79M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let WebView = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Estado para el Modo Proyector (Pantalla completa de video)
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => setScreenData(result.window);
    const dimensionListener = Dimensions.addEventListener('change', onChange);
    return () => dimensionListener?.remove();
  }, []);

  const isDesktop = screenData.width >= 768;

  const tabsList = [
    { key: 'live', label: '📺 Transmisión' },
    { key: 'prayers', label: '🙏 Oración' },
    { key: 'comites', label: '👥 Comités' },
    { key: 'finance', label: '💰 Tesorería' },
    { key: 'services', label: '📋 Cultos' }
  ];

  // Sedes
  const [sedesList, setSedesList] = useState([
    { id: '1', nombre: 'IPUC Mosquera Tercera', url: '', isLive: false }
  ]);
  const [selectedSede, setSelectedSede] = useState(sedesList[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newSedeName, setNewSedeName] = useState('');
  const [newSedeChannelUrl, setNewSedeChannelUrl] = useState('');
  const [newSedeIsLive, setNewSedeIsLive] = useState(false);

  // Oración
  const [prayers, setPrayers] = useState([]);
  const [newPrayerName, setNewPrayerName] = useState('');
  const [newPrayerRequest, setNewPrayerRequest] = useState('');

  // Comités
  const [comitesList, setComitesList] = useState([]);
  const [showComiteForm, setShowComiteForm] = useState(false);
  const [editingComiteId, setEditingComiteId] = useState(null);
  const [newComiteName, setNewComiteName] = useState('');
  const [newComiteLider, setNewComiteLider] = useState('');
  const [newComiteSecretario, setNewComiteSecretario] = useState('');

  // Tesorería
  const [financeList, setFinanceList] = useState([]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [newFinanceLabel, setNewFinanceLabel] = useState('');
  const [newFinanceAmount, setNewFinanceAmount] = useState('');

  // Calendario
  const [selectedDay, setSelectedDay] = useState('2026-11-05');
  const [eventsList, setEventsList] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDetails, setNewEventDetails] = useState('');

  // Sincronización con Supabase
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: sedesData } = await supabase.from('sedes').select('*');
      if (sedesData && sedesData.length > 0) {
        const formatted = sedesData.map(s => ({ ...s, id: String(s.id) }));
        setSedesList(formatted);
        setSelectedSede(prev => formatted.find(s => s.id === String(prev?.id)) || formatted[0]);
      }

      const { data: prayersData } = await supabase.from('prayers').select('*').order('id', { ascending: false });
      if (prayersData && prayersData.length > 0) {
        setPrayers(prayersData.map(p => ({
          ...p,
          status: p.status || 'active',
          count: p.count || 0
        })));
      }

      const { data: comitesData } = await supabase.from('comites').select('*');
      if (comitesData && comitesData.length > 0) {
        setComitesList(comitesData.map(c => ({
          ...c,
          id: String(c.id),
          lider: c.lider || '',
          secretario: c.secretario || ''
        })));
      }

      const { data: financeData } = await supabase.from('finance').select('*');
      if (financeData && financeData.length > 0) setFinanceList(financeData);

      const { data: eventsData } = await supabase.from('events').select('*');
      if (eventsData && eventsData.length > 0) setEventsList(eventsData);

    } catch (err) {
      console.log('Error de sincronización:', err);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lógica de Sedes
  const handleSaveSede = async () => {
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
    if (sedesList.length <= 1) return;
    const targetId = String(idToDelete);
    setSedesList(prev => prev.filter(s => s.id !== targetId));
    if (String(selectedSede?.id) === targetId) setSelectedSede(sedesList[0]);
    await supabase.from('sedes').delete().eq('id', targetId);
  };

  // Lógica de Oración
  const addPrayer = async () => {
    if (newPrayerRequest.trim() === '') return;
    const newObj = { 
      id: String(Date.now()), 
      name: newPrayerName.trim() || 'Anónimo', 
      request: newPrayerRequest.trim(),
      status: 'active',
      count: 1
    };

    setPrayers(prev => [newObj, ...prev]);
    await supabase.from('prayers').insert([newObj]);
    setNewPrayerName('');
    setNewPrayerRequest('');
  };

  const handleSupportPrayer = async (item) => {
    const updatedCount = (item.count || 0) + 1;
    setPrayers(prev => prev.map(p => p.id === item.id ? { ...p, count: updatedCount } : p));
    await supabase.from('prayers').update({ count: updatedCount }).eq('id', item.id);
  };

  const togglePrayerStatus = async (item) => {
    const newStatus = item.status === 'answered' ? 'active' : 'answered';
    setPrayers(prev => prev.map(p => p.id === item.id ? { ...p, status: newStatus } : p));
    await supabase.from('prayers').update({ status: newStatus }).eq('id', item.id);
  };

  const handleDeletePrayer = async (id) => {
    setPrayers(prev => prev.filter(p => p.id !== String(id)));
    await supabase.from('prayers').delete().eq('id', String(id));
  };

  // Lógica Comités
  const handleSaveComite = async () => {
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
    setComitesList(prev => prev.filter(c => c.id !== String(id)));
    await supabase.from('comites').delete().eq('id', String(id));
  };

  // Lógica Tesorería
  const handleSaveFinance = async () => {
    const payload = {
      id: editingFinanceId ? String(editingFinanceId) : String(Date.now()),
      label: newFinanceLabel.trim() || 'Fondo',
      amount: newFinanceAmount.trim() || '$ 0.00',
      color: '#00ffcc'
    };
    setFinanceList(prev => editingFinanceId ? prev.map(f => f.id === payload.id ? payload : f) : [...prev, payload]);
    await supabase.from('finance').upsert([payload]);
    setNewFinanceLabel(''); setNewFinanceAmount(''); setEditingFinanceId(null); setShowFinanceForm(false);
  };

  const handleDeleteFinance = async (id) => {
    if (financeList.length <= 1) return;
    setFinanceList(prev => prev.filter(f => f.id !== String(id)));
    await supabase.from('finance').delete().eq('id', String(id));
  };

  // Lógica Eventos
  const handleSaveEvent = async () => {
    if (!newEventTitle.trim()) return;
    const payload = {
      id: String(Date.now()),
      date: selectedDay,
      title: newEventTitle.trim(),
      time: newEventTime.trim() || '6:00 PM',
      details: newEventDetails.trim() || ''
    };
    setEventsList(prev => [...prev, payload]);
    await supabase.from('events').insert([payload]);
    setNewEventTitle(''); setNewEventTime(''); setNewEventDetails(''); setShowEventForm(false);
  };

  const handleDeleteEvent = async (id) => {
    setEventsList(prev => prev.filter(e => e.id !== String(id)));
    await supabase.from('events').delete().eq('id', String(id));
  };

  const novDays = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const decDays = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);
  const activeTabObj = tabsList.find(t => t.key === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior oculta en modo proyector para máxima limpieza visual */}
      {!isProjectorMode && (
        <View style={styles.topBarContainer}>
          {isDesktop ? (
            <View style={styles.desktopTabRow}>
              {tabsList.map(t => (
                <TouchableOpacity key={t.key} style={[styles.tabButton, activeTab === t.key && styles.activeTab]} onPress={() => setActiveTab(t.key)}>
                  <Text style={[styles.tabText, activeTab === t.key && styles.activeTabText]}>
                    {t.key === 'live' && selectedSede?.isLive ? '📺 Transmisión 🔴' : t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.mobileDropdownWrapper}>
              <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowDropdown(!showDropdown)}>
                <Text style={styles.dropdownSelectorText}>
                  {activeTab === 'live' && selectedSede?.isLive ? '📺 Transmisión 🔴' : (activeTabObj?.label || 'Seleccionar Módulo')}
                </Text>
                <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} disabled={refreshing}>
            <Text style={styles.refreshBtnText}>{refreshing ? '⏳' : '🔄'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isDesktop && showDropdown && !isProjectorMode && (
        <View style={styles.dropdownMenu}>
          {tabsList.map(t => (
            <TouchableOpacity 
              key={t.key} 
              style={[styles.dropdownItem, activeTab === t.key && styles.activeDropdownItem]}
              onPress={() => { setActiveTab(t.key); setShowDropdown(false); }}
            >
              <Text style={[styles.dropdownItemText, activeTab === t.key && styles.activeDropdownItemText]}>
                {t.key === 'live' && selectedSede?.isLive ? '📺 Transmisión 🔴' : t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
        <View style={{ flex: 1, width: '100%' }}>
          
          {/* MÓDULO DE TRANSMISIÓN */}
          {activeTab === 'live' && (
            <ScrollView style={[styles.content, isProjectorMode && { padding: 0, backgroundColor: '#000' }]}>
              
              {!isProjectorMode && (
                <>
                  <View style={styles.sedesHeaderRow}>
                    <Text style={styles.labelHeader}>Sedes Registradas:</Text>
                    {selectedSede && (
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
                        {sedesList.length > 1 && (
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
                      
                      <TouchableOpacity 
                        style={styles.projectorToggleBtn} 
                        onPress={() => setIsProjectorMode(true)}
                      >
                        <Text style={styles.projectorToggleText}>🖥️ Modo Proyector</Text>
                      </TouchableOpacity>
                    </div>
                  </View>
                </>
              )}

              {/* Contenedor de Video (Pantalla Completa en Modo Proyector) */}
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

                {/* Botón flotante para salir del Modo Proyector */}
                {isProjectorMode && (
                  <TouchableOpacity 
                    style={styles.exitProjectorBtn} 
                    onPress={() => setIsProjectorMode(false)}
                  >
                    <Text style={styles.exitProjectorText}>✖ Salir de Modo Proyector</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!isProjectorMode && (
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
                          trackColor={{ false: '#374151', true: '#00ffcc' }}
                          thumbColor={newSedeIsLive ? '#0b0f19' : '#9ca3af'}
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

          {/* MÓDULO DE PETICIONES DE ORACIÓN */}
          {activeTab === 'prayers' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>🙏 Red de Oración Congregacional</Text>
              
              <View style={styles.addSedeCard}>
                <TextInput style={styles.input} placeholder="Tu Nombre (Opcional)" placeholderTextColor="#666" value={newPrayerName} onChangeText={setNewPrayerName} />
                <TextInput style={[styles.input, { height: 80 }]} placeholder="Escribe tu motivo de oración..." placeholderTextColor="#666" multiline value={newPrayerRequest} onChangeText={setNewPrayerRequest} />
                <TouchableOpacity style={styles.actionBtn} onPress={addPrayer}>
                  <Text style={styles.actionBtnText}>Publicar Petición</Text>
                </TouchableOpacity>
              </View>

              {prayers.map(p => (
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
                    <TouchableOpacity onPress={() => handleDeletePrayer(p.id)}>
                      <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSub}>{p.request}</Text>
                  <View style={styles.prayerActionRow}>
                    <TouchableOpacity style={styles.supportBtn} onPress={() => handleSupportPrayer(p)}>
                      <Text style={styles.supportBtnText}>🙏 Me uno en oración ({p.count || 0})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statusToggleBtn} onPress={() => togglePrayerStatus(p)}>
                      <Text style={styles.statusToggleText}>
                        {p.status === 'answered' ? '🔄 Marcar en Oración' : '✅ Marcar Respondida'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* MÓDULO DE COMITÉS */}
          {activeTab === 'comites' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>👥 Comités de Trabajo</Text>
              
              {comitesList.map(comite => (
                <View key={comite.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>🏛️ {comite.nombre}</Text>
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
                        <Text style={{ color: '#00ffcc', fontWeight: 'bold' }}>✏️ Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteComite(comite.id)}>
                        <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕ Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ marginTop: 8, backgroundColor: '#1f2937', padding: 10, borderRadius: 8 }}>
                    <Text style={styles.cardSub}>👤 <Text style={{ fontWeight: 'bold', color: '#00ffcc' }}>1. Líder:</Text> {comite.lider || 'No asignado'}</Text>
                    <Text style={[styles.cardSub, { marginTop: 4 }]}>📝 <Text style={{ fontWeight: 'bold', color: '#00ffcc' }}>2. Secretario:</Text> {comite.secretario || 'No asignado'}</Text>
                  </View>
                </View>
              ))}

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
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nombre del Comité" 
                    placeholderTextColor="#666" 
                    value={newComiteName} 
                    onChangeText={setNewComiteName} 
                  />
                  <TextInput 
                    style={styles.input} 
                    placeholder="1. Nombre del Líder" 
                    placeholderTextColor="#666" 
                    value={newComiteLider} 
                    onChangeText={setNewComiteLider} 
                  />
                  <TextInput 
                    style={styles.input} 
                    placeholder="2. Nombre del Secretario" 
                    placeholderTextColor="#666" 
                    value={newComiteSecretario} 
                    onChangeText={setNewComiteSecretario} 
                  />
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSaveComite}>
                    <Text style={styles.actionBtnText}>
                      {editingComiteId ? 'Actualizar Comité' : 'Guardar Comité'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* MÓDULO DE TESORERÍA */}
          {activeTab === 'finance' && (
            <ScrollView style={styles.content}>
              <Text style={styles.centeredSectionTitle}>Diezmos - Ofrendas y Donaciones</Text>
              <View style={styles.metricContainer}>
                {financeList.map(item => (
                  <View key={item.id} style={[styles.metricCard, isDesktop && { width: '32%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.metricLabel}>{item.label}</Text>
                      {financeList.length > 1 && (
                        <TouchableOpacity onPress={() => handleDeleteFinance(item.id)}>
                          <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[styles.metricValue, { color: item.color || '#00ffcc' }]}>{item.amount}</Text>
                  </View>
                ))}
              </View>
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
            </ScrollView>
          )}

          {/* MÓDULO DE CULTOS */}
          {activeTab === 'services' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>📅 Calendario de Cultos</Text>
              
              <Text style={styles.cardSub}>Noviembre 2026</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                {novDays.map((dayStr) => {
                  const hasEvent = eventsList.some(e => e.date === dayStr);
                  return (
                    <TouchableOpacity 
                      key={dayStr} 
                      style={[styles.dayBox, selectedDay === dayStr && styles.selectedDayBox]} 
                      onPress={() => setSelectedDay(dayStr)}
                    >
                      <Text style={[styles.dayText, selectedDay === dayStr && styles.selectedDayText]}>
                        {dayStr.split('-')[2]}
                      </Text>
                      {hasEvent && (
                        <View style={[styles.eventDot, selectedDay === dayStr && styles.selectedEventDot]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              <View style={{ marginTop: 12 }}>
                <Text style={styles.cardSub}>Diciembre 2026</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                  {decDays.map((dayStr) => {
                    const hasEvent = eventsList.some(e => e.date === dayStr);
                    return (
                      <TouchableOpacity 
                        key={dayStr} 
                        style={[styles.dayBox, selectedDay === dayStr && styles.selectedDayBox]} 
                        onPress={() => setSelectedDay(dayStr)}
                      >
                        <Text style={[styles.dayText, selectedDay === dayStr && styles.selectedDayText]}>
                          {dayStr.split('-')[2]}
                        </Text>
                        {hasEvent && (
                          <View style={[styles.eventDot, selectedDay === dayStr && styles.selectedEventDot]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.selectedDayHeader}>
                <Text style={styles.sectionTitle}>Eventos del {selectedDay}</Text>
                <TouchableOpacity style={styles.smallAddBtn} onPress={() => setShowEventForm(!showEventForm)}>
                  <Text style={styles.smallAddText}>{showEventForm ? '✕ Cancelar' : '➕ Agregar'}</Text>
                </TouchableOpacity>
              </View>

              {showEventForm && (
                <View style={styles.addSedeCard}>
                  <TextInput style={styles.input} placeholder="Título del Evento" placeholderTextColor="#666" value={newEventTitle} onChangeText={setNewEventTitle} />
                  <TextInput style={styles.input} placeholder="Hora (Ej: 7:00 PM)" placeholderTextColor="#666" value={newEventTime} onChangeText={setNewEventTime} />
                  <TextInput style={styles.input} placeholder="Detalles" placeholderTextColor="#666" value={newEventDetails} onChangeText={setNewEventDetails} />
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSaveEvent}>
                    <Text style={styles.actionBtnText}>Guardar Evento</Text>
                  </TouchableOpacity>
                </View>
              )}

              {eventsList.filter(e => e.date === selectedDay).length > 0 ? (
                eventsList.filter(e => e.date === selectedDay).map(ev => (
                  <View key={ev.id} style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>⏰ {ev.time} - {ev.title}</Text>
                      <TouchableOpacity onPress={() => handleDeleteEvent(ev.id)}>
                        <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕ Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cardSub}>{ev.details}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.card}>
                  <Text style={[styles.cardSub, { textAlign: 'center' }]}>No hay eventos para este día.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  topBarContainer: { flexDirection: 'row', backgroundColor: '#111827', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 56, borderBottomWidth: 1, borderColor: '#1f2937', zIndex: 10 },
  desktopTabRow: { flexDirection: 'row', flex: 1 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#00ffcc' },
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  activeTabText: { color: '#00ffcc', fontWeight: 'bold' },
  mobileDropdownWrapper: { flex: 1, marginRight: 10 },
  dropdownSelector: { backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  dropdownSelectorText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 14 },
  dropdownArrow: { color: '#00ffcc', fontSize: 12, marginLeft: 8 },
  dropdownMenu: { backgroundColor: '#111827', borderBottomWidth: 2, borderColor: '#00ffcc', paddingVertical: 4, position: 'absolute', top: 56, left: 0, right: 0, zIndex: 99 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#1f2937' },
  activeDropdownItem: { backgroundColor: '#1f2937' },
  dropdownItemText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  activeDropdownItemText: { color: '#00ffcc', fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  refreshBtnText: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold' },
  mainWrapper: { flex: 1 },
  desktopWrapper: { maxWidth: 1024, alignSelf: 'center', width: '100%' },
  content: { flex: 1, padding: 16 },
  sedesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelHeader: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af' },
  editSedeText: { fontSize: 12, fontWeight: 'bold', color: '#00ffcc' },
  sedeChipWrapper: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  sedeChip: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#374151' },
  activeSedeChip: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
  sedeChipText: { fontSize: 13, color: '#d1d5db' },
  activeSedeChipText: { color: '#0b0f19', fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#ff0055', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: -6, marginTop: -10, zIndex: 2 },
  deleteBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  centeredSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  liveBadge: { backgroundColor: '#3f0d12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ff0055' },
  liveBadgeText: { color: '#ff3366', fontSize: 11, fontWeight: 'bold' },
  offlineBadge: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  offlineBadgeText: { color: '#9ca3af', fontSize: 11, fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#374151', marginBottom: 12 },
  switchLabel: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  
  // Estilos de Video y Modo Proyector
  videoContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1f2937', shadowColor: '#00ffcc', shadowOpacity: 0.15, shadowRadius: 10 },
  desktopVideoContainer: { height: 380 },
  fullScreenProjectorContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', zIndex: 9999, borderRadius: 0, borderWidth: 0 },
  projectorToggleBtn: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#00ffcc' },
  projectorToggleText: { color: '#00ffcc', fontSize: 11, fontWeight: 'bold' },
  exitProjectorBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255, 0, 85, 0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, zIndex: 10000 },
  exitProjectorText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  emptyVideoBox: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyVideoText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  addSedeToggleBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#00ffcc', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#111827' },
  addSedeToggleText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 13 },
  addSedeCard: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderColor: '#00ffcc', shadowColor: '#00ffcc', shadowOpacity: 0.2, shadowRadius: 8 },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' },
  answeredCard: { borderColor: '#00ffcc', backgroundColor: '#0b1f1a' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginRight: 8 },
  cardSub: { fontSize: 13, color: '#d1d5db', marginTop: 4, lineHeight: 18 },
  input: { backgroundColor: '#1f2937', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#374151', marginBottom: 8, color: '#ffffff', fontSize: 14 },
  actionBtn: { backgroundColor: '#00ffcc', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4, shadowColor: '#00ffcc', shadowOpacity: 0.3, shadowRadius: 10 },
  actionBtnText: { color: '#0b0f19', fontWeight: 'bold', fontSize: 14 },
  metricContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  metricCard: { width: '48%', backgroundColor: '#111827', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#1f2937', marginBottom: 10 },
  metricLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  metricValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  daysScroll: { flexDirection: 'row', marginVertical: 8 },
  dayBox: { width: 44, height: 48, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: '#1f2937', marginRight: 6 },
  selectedDayBox: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
  dayText: { fontSize: 14, fontWeight: 'bold', color: '#d1d5db' },
  selectedDayText: { color: '#0b0f19' },
  selectedDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  smallAddBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  smallAddText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 12 },
  
  // Estilos de Oración
  activePrayerBadge: { backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activePrayerBadgeText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  answeredBadge: { backgroundColor: '#064e3b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  answeredBadgeText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  prayerActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderColor: '#1f2937' },
  supportBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  supportBtnText: { color: '#00ffcc', fontSize: 12, fontWeight: 'bold' },
  statusToggleBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  statusToggleText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },

  // Estilos de Calendario
  eventDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#00ffcc', marginTop: 2 },
  selectedEventDot: { backgroundColor: '#0b0f19' }
});