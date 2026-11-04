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
  Dimensions 
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase Unificada
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
  
  // Detección dinámica de las dimensiones de la pantalla
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };
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
    { id: '1', nombre: 'IPUC Mosquera Tercera', url: '' }
  ]);
  const [selectedSede, setSelectedSede] = useState(sedesList[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newSedeName, setNewSedeName] = useState('');
  const [newSedeChannelUrl, setNewSedeChannelUrl] = useState('');

  // Oración
  const [prayers, setPrayers] = useState([
    { id: '1', name: 'Hermana María G.', request: 'Oración por la salud de la familia y pronta recuperación.' },
    { id: '2', name: 'Hermano Carlos R.', request: 'Acción de gracias y bendición para un proyecto de trabajo.' },
  ]);
  const [newPrayer, setNewPrayer] = useState('');

  // Comités
  const [comitesList, setComitesList] = useState([
    { id: '1', nombre: 'Comité de Jóvenes', descripcion: 'Coordinación de actividades juveniles y eventos especiales' },
    { id: '2', nombre: 'Comité de Misiones', descripcion: 'Apoyo y planificación de obra misionera' }
  ]);
  const [showComiteForm, setShowComiteForm] = useState(false);
  const [editingComiteId, setEditingComiteId] = useState(null);
  const [newComiteName, setNewComiteName] = useState('');
  const [newComiteDesc, setNewComiteDesc] = useState('');

  // Tesorería
  const [financeList, setFinanceList] = useState([
    { id: '1', label: 'Diezmos Registrados', amount: '$ 0.00', color: '#00ffcc' },
    { id: '2', label: 'Fondos de Pro-Templo', amount: '$ 0.00', color: '#00e5ff' }
  ]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [newFinanceLabel, setNewFinanceLabel] = useState('');
  const [newFinanceAmount, setNewFinanceAmount] = useState('');

  // Calendario
  const [selectedDay, setSelectedDay] = useState('2026-11-05');
  const [eventsList, setEventsList] = useState([
    { id: '1', date: '2026-11-05', title: 'Culto de Adoración y Jóvenes', time: '7:00 PM', details: 'Predica el Pastor invitado y alabanza especial.' },
    { id: '2', date: '2026-12-15', title: 'Culto Navideño Especial', time: '6:30 PM', details: 'Programa especial de fin de año con toda la congregación.' }
  ]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDetails, setNewEventDetails] = useState('');

  // Sincronizar datos con Supabase
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: sedesData } = await supabase.from('sedes').select('*');
      if (sedesData && sedesData.length > 0) {
        setSedesList(sedesData);
        setSelectedSede(prev => sedesData.find(s => s.id === prev?.id) || sedesData[0]);
      }

      const { data: comitesData } = await supabase.from('comites').select('*');
      if (comitesData && comitesData.length > 0) setComitesList(comitesData);

      const { data: financeData } = await supabase.from('finance').select('*');
      if (financeData && financeData.length > 0) setFinanceList(financeData);

      const { data: eventsData } = await supabase.from('events').select('*');
      if (eventsData && eventsData.length > 0) setEventsList(eventsData);

      const { data: prayersData } = await supabase.from('prayers').select('*');
      if (prayersData && prayersData.length > 0) setPrayers(prayersData);
    } catch (err) {
      console.log('Error sincronizando con Supabase:', err);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Guardar Sede
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

    const newSedeObj = {
      id: editingId || Date.now().toString(),
      nombre: finalName,
      url: finalUrl
    };

    if (editingId) {
      setSedesList(sedesList.map(s => s.id === editingId ? newSedeObj : s));
      await supabase.from('sedes').update({ nombre: finalName, url: finalUrl }).eq('id', editingId);
    } else {
      setSedesList([...sedesList, newSedeObj]);
      await supabase.from('sedes').insert([newSedeObj]);
    }

    setSelectedSede(newSedeObj);
    setNewSedeName('');
    setNewSedeChannelUrl('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleDeleteSede = async (idToDelete) => {
    if (sedesList.length <= 1) return;
    const updated = sedesList.filter(s => s.id !== idToDelete);
    setSedesList(updated);
    if (selectedSede?.id === idToDelete) setSelectedSede(updated[0]);
    await supabase.from('sedes').delete().eq('id', idToDelete);
  };

  // Guardar Oración
  const addPrayer = async () => {
    if (newPrayer.trim() === '') return;
    const newPrayerObj = {
      id: Date.now().toString(),
      name: 'Tú',
      request: newPrayer.trim()
    };
    
    setPrayers([newPrayerObj, ...prayers]);
    await supabase.from('prayers').insert([newPrayerObj]);
    setNewPrayer('');
  };

  // Guardar Comité
  const handleSaveComite = async () => {
    const finalName = newComiteName.trim() || 'Comité sin nombre';
    const finalDesc = newComiteDesc.trim();
    const newComite = {
      id: editingComiteId || Date.now().toString(),
      nombre: finalName,
      descripcion: finalDesc
    };

    if (editingComiteId) {
      setComitesList(comitesList.map(c => c.id === editingComiteId ? newComite : c));
      await supabase.from('comites').update({ nombre: finalName, descripcion: finalDesc }).eq('id', editingComiteId);
    } else {
      setComitesList([...comitesList, newComite]);
      await supabase.from('comites').insert([newComite]);
    }

    setNewComiteName('');
    setNewComiteDesc('');
    setEditingComiteId(null);
    setShowComiteForm(false);
  };

  const handleDeleteComite = async (idToDelete) => {
    setComitesList(comitesList.filter(c => c.id !== idToDelete));
    await supabase.from('comites').delete().eq('id', idToDelete);
  };

  // Guardar Tesorería
  const handleSaveFinance = async () => {
    const finalLabel = newFinanceLabel.trim() || 'Nuevo Fondo';
    const finalAmount = newFinanceAmount.trim() || '$ 0.00';
    const newFinance = {
      id: editingFinanceId || Date.now().toString(),
      label: finalLabel,
      amount: finalAmount,
      color: '#00ffcc'
    };

    if (editingFinanceId) {
      setFinanceList(financeList.map(f => f.id === editingFinanceId ? newFinance : f));
      await supabase.from('finance').update({ label: finalLabel, amount: finalAmount }).eq('id', editingFinanceId);
    } else {
      setFinanceList([...financeList, newFinance]);
      await supabase.from('finance').insert([newFinance]);
    }

    setNewFinanceLabel('');
    setNewFinanceAmount('');
    setEditingFinanceId(null);
    setShowFinanceForm(false);
  };

  const handleDeleteFinance = async (idToDelete) => {
    if (financeList.length <= 1) return;
    setFinanceList(financeList.filter(f => f.id !== idToDelete));
    await supabase.from('finance').delete().eq('id', idToDelete);
  };

  // Guardar Evento
  const handleSaveEvent = async () => {
    if (!newEventTitle.trim()) return;
    const newEvent = {
      id: Date.now().toString(),
      date: selectedDay,
      title: newEventTitle.trim(),
      time: newEventTime.trim() || '6:00 PM',
      details: newEventDetails.trim() || 'Sin detalles adicionales'
    };

    setEventsList([...eventsList, newEvent]);
    await supabase.from('events').insert([newEvent]);

    setNewEventTitle('');
    setNewEventTime('');
    setNewEventDetails('');
    setShowEventForm(false);
  };

  const handleDeleteEvent = async (idToDelete) => {
    setEventsList(eventsList.filter(e => e.id !== idToDelete));
    await supabase.from('events').delete().eq('id', idToDelete);
  };

  const novDays = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const decDays = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);

  const activeTabObj = tabsList.find(t => t.key === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior Adaptativo */}
      <View style={styles.topBarContainer}>
        {isDesktop ? (
          // Vista Horizontal para Escritorio
          <View style={styles.desktopTabRow}>
            {tabsList.map(t => (
              <TouchableOpacity key={t.key} style={[styles.tabButton, activeTab === t.key && styles.activeTab]} onPress={() => setActiveTab(t.key)}>
                <Text style={[styles.tabText, activeTab === t.key && styles.activeTabText]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Selector Desplegable (Dropdown) para Dispositivos Móviles
          <View style={styles.mobileDropdownWrapper}>
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.dropdownSelectorText}>{activeTabObj?.label || 'Seleccionar Módulo'}</Text>
              <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón de Refrescar Datos */}
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} disabled={refreshing}>
          <Text style={styles.refreshBtnText}>{refreshing ? '⏳' : '🔄'}</Text>
        </TouchableOpacity>
      </View>

      {/* Menú Desplegable Flotante en Móviles */}
      {!isDesktop && showDropdown && (
        <View style={styles.dropdownMenu}>
          {tabsList.map(t => (
            <TouchableOpacity 
              key={t.key} 
              style={[styles.dropdownItem, activeTab === t.key && styles.activeDropdownItem]}
              onPress={() => {
                setActiveTab(t.key);
                setShowDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, activeTab === t.key && styles.activeDropdownItemText]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Contenedor Principal */}
      <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
        <View style={{ flex: 1, width: '100%' }}>
          {activeTab === 'live' && (
            <ScrollView style={styles.content}>
              <View style={styles.sedesHeaderRow}>
                <Text style={styles.labelHeader}>Sedes Registradas:</Text>
                {selectedSede && (
                  <TouchableOpacity onPress={() => { setEditingId(selectedSede.id); setNewSedeName(selectedSede.nombre); setNewSedeChannelUrl(selectedSede.url); setShowAddForm(true); }}>
                    <Text style={styles.editSedeText}>✏️ Modificar Sede Actual</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {sedesList.map((item) => (
                  <View key={item.id} style={styles.sedeChipWrapper}>
                    <TouchableOpacity style={[styles.sedeChip, selectedSede?.id === item.id && styles.activeSedeChip]} onPress={() => setSelectedSede(item)}>
                      <Text style={[styles.sedeChipText, selectedSede?.id === item.id && styles.activeSedeChipText]}>
                        🏛️ {item.nombre}
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
              </View>

              <View style={[styles.videoContainer, isDesktop && styles.desktopVideoContainer]}>
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
              </View>

              <TouchableOpacity style={styles.addSedeToggleBtn} onPress={() => setShowAddForm(!showAddForm)}>
                <Text style={styles.addSedeToggleText}>{showAddForm ? '❌ Cancelar' : '➕ Registrar Nueva Sede'}</Text>
              </TouchableOpacity>

              {showAddForm && (
                <View style={styles.addSedeCard}>
                  <TextInput style={styles.input} placeholder="Nombre de la Sede" placeholderTextColor="#666" value={newSedeName} onChangeText={setNewSedeName} />
                  <TextInput style={styles.input} placeholder="URL de YouTube" placeholderTextColor="#666" value={newSedeChannelUrl} onChangeText={setNewSedeChannelUrl} />
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSaveSede}>
                    <Text style={styles.actionBtnText}>Guardar en Base de Datos</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {activeTab === 'prayers' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>Peticiones de Oración</Text>
              <View style={styles.formGroup}>
                <TextInput style={styles.input} placeholder="Escribe tu petición..." placeholderTextColor="#666" value={newPrayer} onChangeText={setNewPrayer} />
                <TouchableOpacity style={styles.actionBtn} onPress={addPrayer}>
                  <Text style={styles.actionBtnText}>Publicar Petición</Text>
                </TouchableOpacity>
              </View>
              {prayers.map(p => (
                <View key={p.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Text style={styles.cardSub}>{p.request}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {activeTab === 'comites' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>Comités de Trabajo</Text>
              {comitesList.map(comite => (
                <View key={comite.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{comite.nombre}</Text>
                    <TouchableOpacity onPress={() => handleDeleteComite(comite.id)}>
                      <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>✕ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSub}>{comite.descripcion}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.addSedeToggleBtn} onPress={() => setShowComiteForm(!showComiteForm)}>
                <Text style={styles.addSedeToggleText}>{showComiteForm ? '❌ Cancelar' : '➕ Crear Nuevo Comité'}</Text>
              </TouchableOpacity>
              {showComiteForm && (
                <View style={styles.addSedeCard}>
                  <TextInput style={styles.input} placeholder="Nombre del Comité" placeholderTextColor="#666" value={newComiteName} onChangeText={setNewComiteName} />
                  <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor="#666" value={newComiteDesc} onChangeText={setNewComiteDesc} />
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSaveComite}>
                    <Text style={styles.actionBtnText}>Guardar Comité</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

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

          {activeTab === 'services' && (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>📅 Calendario de Cultos</Text>
              <Text style={styles.cardSub}>Noviembre 2026</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                {novDays.map((dayStr) => (
                  <TouchableOpacity key={dayStr} style={[styles.dayBox, selectedDay === dayStr && styles.selectedDayBox]} onPress={() => setSelectedDay(dayStr)}>
                    <Text style={[styles.dayText, selectedDay === dayStr && styles.selectedDayText]}>{dayStr.split('-')[2]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={{ marginTop: 12 }}>
                <Text style={styles.cardSub}>Diciembre 2026</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                  {decDays.map((dayStr) => (
                    <TouchableOpacity key={dayStr} style={[styles.dayBox, selectedDay === dayStr && styles.selectedDayBox]} onPress={() => setSelectedDay(dayStr)}>
                      <Text style={[styles.dayText, selectedDay === dayStr && styles.selectedDayText]}>{dayStr.split('-')[2]}</Text>
                    </TouchableOpacity>
                  ))}
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  centeredSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  videoContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  desktopVideoContainer: { height: 380 },
  emptyVideoBox: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyVideoText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  addSedeToggleBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#00ffcc', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#111827' },
  addSedeToggleText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 13 },
  addSedeCard: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderColor: '#00ffcc' },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  formGroup: { marginBottom: 16 },
  input: { backgroundColor: '#1f2937', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#374151', marginBottom: 8, color: '#ffffff', fontSize: 14 },
  actionBtn: { backgroundColor: '#00ffcc', padding: 14, borderRadius: 12, alignItems: 'center' },
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
  smallAddText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 12 }
});