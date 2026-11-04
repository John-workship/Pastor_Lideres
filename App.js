import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView,
  TextInput,
  Platform 
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let WebView = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  
  // Lista de sedes persistentes
  const [sedesList, setSedesList] = useState([
    { 
      id: '1', 
      nombre: 'IPUC Mosquera Tercera', 
      url: '' 
    }
  ]);

  // Sede seleccionada por defecto
  const [selectedSede, setSelectedSede] = useState(sedesList[0]);

  // Formulario para agregar / editar sede
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newSedeName, setNewSedeName] = useState('');
  const [newSedeChannelUrl, setNewSedeChannelUrl] = useState('');

  const [pastServices, setPastServices] = useState([
    { id: '1', title: 'Escuela Dominical', speaker: 'IPUC Mosquera Tercera', duration: 'Grabación' },
    { id: '2', title: 'Culto de Adoración', speaker: 'Equipo Ministerial', duration: 'Grabado' }
  ]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Estado Peticiones de Oración
  const [prayers, setPrayers] = useState([
    { id: '1', name: 'Hermana María G.', request: 'Oración por la salud de la familia y pronta recuperación.' },
    { id: '2', name: 'Hermano Carlos R.', request: 'Acción de gracias y bendición para un proyecto de trabajo.' },
  ]);
  const [newPrayer, setNewPrayer] = useState('');

  // Estado para la Gestión de Comités
  const [comitesList, setComitesList] = useState([
    { id: '1', nombre: 'Comité de Jóvenes', descripcion: 'Coordinación de actividades juveniles y eventos especiales' },
    { id: '2', nombre: 'Comité de Misiones', descripcion: 'Apoyo y planificación de obra misionera' }
  ]);
  const [showComiteForm, setShowComiteForm] = useState(false);
  const [editingComiteId, setEditingComiteId] = useState(null);
  const [newComiteName, setNewComiteName] = useState('');
  const [newComiteDesc, setNewComiteDesc] = useState('');

  // Estado para la Gestión de Tesorería / Finanzas
  const [financeList, setFinanceList] = useState([
    { id: '1', label: 'Diezmos Registrados', amount: '$ 0.00', color: '#00ffcc' },
    { id: '2', label: 'Fondos de Pro-Templo', amount: '$ 0.00', color: '#00e5ff' }
  ]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [newFinanceLabel, setNewFinanceLabel] = useState('');
  const [newFinanceAmount, setNewFinanceAmount] = useState('');

  // Estado para el Calendario de Cultos (2 Meses: Noviembre y Diciembre 2026)
  const [selectedDay, setSelectedDay] = useState('2026-11-05');
  const [eventsList, setEventsList] = useState([
    { id: '1', date: '2026-11-05', title: 'Culto de Adoración y Jóvenes', time: '7:00 PM', details: 'Predica el Pastor invitado y alabanza especial.' },
    { id: '2', date: '2026-12-15', title: 'Culto Navideño Especial', time: '6:30 PM', details: 'Programa especial de fin de año con toda la congregación.' }
  ]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDetails, setNewEventDetails] = useState('');

  // Consultar Supabase para mantener la lista actualizada
  useEffect(() => {
    async function fetchSedesFromSupabase() {
      try {
        const { data } = await supabase.from('sedes').select('*');
        if (data && data.length > 0) {
          setSedesList(data);
          setSelectedSede(data[0]);
        }
      } catch (err) {
        console.log('Usando sedes locales persistentes:', err);
      }
    }

    if (activeTab === 'live') {
      fetchSedesFromSupabase();
    }
  }, [activeTab]);

  // Guardar o Actualizar Sede
  const handleSaveSede = async () => {
    if (editingId) {
      const finalName = newSedeName.trim();
      let finalUrl = '';

      if (newSedeChannelUrl.trim() !== '') {
        let rawInput = newSedeChannelUrl.trim();
        finalUrl = rawInput;

        if (rawInput.includes('watch?v=')) {
          const videoId = rawInput.split('v=')[1]?.split('&')[0];
          finalUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (rawInput.includes('youtu.be/')) {
          const videoId = rawInput.split('youtu.be/')[1]?.split('?')[0];
          finalUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (rawInput.includes('/channel/')) {
          const channelId = rawInput.split('/channel/')[1]?.split('/')[0];
          finalUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
        } else if (!rawInput.includes('embed')) {
          finalUrl = `https://www.youtube.com/embed/live_stream?channel=${rawInput}`;
        }
      }

      const updatedList = sedesList.map(sede => {
        if (sede.id === editingId) {
          const updated = { ...sede, nombre: finalName, url: finalUrl };
          if (selectedSede?.id === editingId) setSelectedSede(updated);
          return updated;
        }
        return sede;
      });
      setSedesList(updatedList);

      try {
        await supabase.from('sedes').update({ nombre: finalName, url: finalUrl }).eq('id', editingId);
      } catch (e) {
        console.log('Sede actualizada localmente.');
      }
    } else {
      const finalName = newSedeName.trim() !== '' ? newSedeName.trim() : 'Nueva Sede';
      let finalUrl = '';

      if (newSedeChannelUrl.trim() !== '') {
        let rawInput = newSedeChannelUrl.trim();
        finalUrl = rawInput;
        if (rawInput.includes('watch?v=')) {
          const videoId = rawInput.split('v=')[1]?.split('&')[0];
          finalUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (rawInput.includes('youtu.be/')) {
          const videoId = rawInput.split('youtu.be/')[1]?.split('?')[0];
          finalUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (rawInput.includes('/channel/')) {
          const channelId = rawInput.split('/channel/')[1]?.split('/')[0];
          finalUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
        } else if (!rawInput.includes('embed')) {
          finalUrl = `https://www.youtube.com/embed/live_stream?channel=${rawInput}`;
        }
      }

      const newSedeObj = {
        id: Date.now().toString(),
        nombre: finalName,
        url: finalUrl
      };

      const updatedList = [...sedesList, newSedeObj];
      setSedesList(updatedList);
      setSelectedSede(newSedeObj);

      try {
        await supabase.from('sedes').insert([{ nombre: finalName, url: finalUrl }]);
      } catch (e) {
        console.log('Sede guardada localmente.');
      }
    }

    setNewSedeName('');
    setNewSedeChannelUrl('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEditSedeClick = (sede) => {
    setEditingId(sede.id);
    setNewSedeName(sede.nombre);
    setNewSedeChannelUrl(sede.url);
    setShowAddForm(true);
  };

  const handleDeleteSede = async (idToDelete) => {
    if (sedesList.length <= 1) return;

    const updatedList = sedesList.filter(sede => sede.id !== idToDelete);
    setSedesList(updatedList);

    if (selectedSede?.id === idToDelete) {
      setSelectedSede(updatedList[0]);
    }

    try {
      await supabase.from('sedes').delete().eq('id', idToDelete);
    } catch (e) {
      console.log('Sede eliminada de la vista local.');
    }
  };

  // Guardar, Crear o Actualizar Comité
  const handleSaveComite = () => {
    const finalName = newComiteName.trim() !== '' ? newComiteName.trim() : 'Comité sin nombre';
    const finalDesc = newComiteDesc.trim();

    if (editingComiteId) {
      const updated = comitesList.map(c => {
        if (c.id === editingComiteId) {
          return { ...c, nombre: finalName, descripcion: finalDesc };
        }
        return c;
      });
      setComitesList(updated);
    } else {
      const newComite = {
        id: Date.now().toString(),
        nombre: finalName,
        descripcion: finalDesc
      };
      setComitesList([...comitesList, newComite]);
    }

    setNewComiteName('');
    setNewComiteDesc('');
    setEditingComiteId(null);
    setShowComiteForm(false);
  };

  const handleEditComiteClick = (comite) => {
    setEditingComiteId(comite.id);
    setNewComiteName(comite.nombre);
    setNewComiteDesc(comite.descripcion);
    setShowComiteForm(true);
  };

  const handleDeleteComite = (idToDelete) => {
    setComitesList(comitesList.filter(c => c.id !== idToDelete));
  };

  // Guardar, Crear o Actualizar Tesorería / Finanzas
  const handleSaveFinance = () => {
    const finalLabel = newFinanceLabel.trim() !== '' ? newFinanceLabel.trim() : 'Nuevo Fondo';
    const finalAmount = newFinanceAmount.trim() !== '' ? newFinanceAmount.trim() : '$ 0.00';

    if (editingFinanceId) {
      const updated = financeList.map(f => {
        if (f.id === editingFinanceId) {
          return { ...f, label: finalLabel, amount: finalAmount };
        }
        return f;
      });
      setFinanceList(updated);
    } else {
      const newFinance = {
        id: Date.now().toString(),
        label: finalLabel,
        amount: finalAmount,
        color: '#00ffcc'
      };
      setFinanceList([...financeList, newFinance]);
    }

    setNewFinanceLabel('');
    setNewFinanceAmount('');
    setEditingFinanceId(null);
    setShowFinanceForm(false);
  };

  const handleEditFinanceClick = (item) => {
    setEditingFinanceId(item.id);
    setNewFinanceLabel(item.label);
    setNewFinanceAmount(item.amount);
    setShowFinanceForm(true);
  };

  const handleDeleteFinance = (idToDelete) => {
    if (financeList.length <= 1) return;
    setFinanceList(financeList.filter(f => f.id !== idToDelete));
  };

  // Crear nuevo evento en el calendario de cultos
  const handleSaveEvent = () => {
    if (!newEventTitle.trim()) return;

    const newEvent = {
      id: Date.now().toString(),
      date: selectedDay,
      title: newEventTitle.trim(),
      time: newEventTime.trim() || '6:00 PM',
      details: newEventDetails.trim() || 'Sin detalles adicionales'
    };

    setEventsList([...eventsList, newEvent]);
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventDetails('');
    setShowEventForm(false);
  };

  const handleDeleteEvent = (idToDelete) => {
    setEventsList(eventsList.filter(e => e.id !== idToDelete));
  };

  const addPrayer = () => {
    if (newPrayer.trim() === '') return;
    setPrayers([{ id: Date.now().toString(), name: 'Tú', request: newPrayer }, ...prayers]);
    setNewPrayer('');
  };

  const novDays = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const decDays = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);

  return (
    <SafeAreaView style={styles.container}>
      {/* Menú Superior Neón */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'live' && styles.activeTab]} 
          onPress={() => setActiveTab('live')}
        >
          <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>
            📺 Transmisión {selectedSede?.url && selectedSede.url.trim() !== '' ? '🔴' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'prayers' && styles.activeTab]} 
          onPress={() => setActiveTab('prayers')}
        >
          <Text style={[styles.tabText, activeTab === 'prayers' && styles.activeTabText]}>🙏 Oración</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'comites' && styles.activeTab]} 
          onPress={() => setActiveTab('comites')}
        >
          <Text style={[styles.tabText, activeTab === 'comites' && styles.activeTabText]}>👥 Comités</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'finance' && styles.activeTab]} 
          onPress={() => setActiveTab('finance')}
        >
          <Text style={[styles.tabText, activeTab === 'finance' && styles.activeTabText]}>💰 Tesorería</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'services' && styles.activeTab]} 
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>📋 Cultos</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Contenido Dinámico */}
      <View style={{ flex: 1 }}>
        {/* TRANSMISIÓN Y SEDES */}
        {activeTab === 'live' && (
          <ScrollView style={styles.content}>
            <View style={styles.sedesHeaderRow}>
              <Text style={styles.labelHeader}>Sedes Registradas:</Text>
              {selectedSede && (
                <TouchableOpacity onPress={() => handleEditSedeClick(selectedSede)}>
                  <Text style={styles.editSedeText}>✏️ Modificar Sede Actual</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {sedesList.map((item) => (
                <View key={item.id} style={styles.sedeChipWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.sedeChip,
                      selectedSede?.id === item.id && styles.activeSedeChip
                    ]}
                    onPress={() => setSelectedSede(item)}
                  >
                    <Text style={[
                      styles.sedeChipText,
                      selectedSede?.id === item.id && styles.activeSedeChipText
                    ]}>
                      🏛️ {item.nombre || 'Sin Nombre'} {item.url && item.url.trim() !== '' ? '🔴' : ''}
                    </Text>
                  </TouchableOpacity>

                  {sedesList.length > 1 && (
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteSede(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>{selectedSede?.nombre || 'Sede sin nombre'}</Text>
              
              {selectedSede?.url && selectedSede.url.trim() !== '' ? (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>🔴 SEÑAL EN DIRECTO (Auto)</Text>
                </View>
              ) : (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineBadgeText}>⚪ TRANSMISIÓN OFFLINE</Text>
                </View>
              )}
            </View>

            <View style={styles.videoContainer}>
              {selectedSede?.url && selectedSede.url.trim() !== '' ? (
                Platform.OS === 'web' ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={selectedSede.url}
                    title={`YouTube Stream ${selectedSede?.nombre}`}
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : (
                  WebView && (
                    <WebView
                      style={{ flex: 1 }}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      source={{ uri: selectedSede.url }}
                    />
                  )
                )
              ) : (
                <View style={styles.emptyVideoBox}>
                  <Text style={styles.emptyVideoText}>⚠️ No hay URL de transmisión configurada.</Text>
                  <Text style={styles.emptyVideoSubText}>Haz clic en "Modificar Sede Actual" para agregar el canal.</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.addSedeToggleBtn}
              onPress={() => {
                if (showAddForm) {
                  setEditingId(null);
                  setNewSedeName('');
                  setNewSedeChannelUrl('');
                }
                setShowAddForm(!showAddForm);
              }}
            >
              <Text style={styles.addSedeToggleText}>
                {showAddForm ? '❌ Cancelar' : '➕ Registrar Nueva Sede'}
              </Text>
            </TouchableOpacity>

            {showAddForm && (
              <View style={styles.addSedeCard}>
                <Text style={styles.cardTitle}>
                  {editingId ? '✏️ Modificar Sede / URL' : '➕ Registrar Nueva Sede o Canal'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de la Sede (Opcional)"
                  placeholderTextColor="#666"
                  value={newSedeName}
                  onChangeText={setNewSedeName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="URL de YouTube o ID del canal (Opcional)"
                  placeholderTextColor="#666"
                  value={newSedeChannelUrl}
                  onChangeText={newSedeChannelUrl => setNewSedeChannelUrl(newSedeChannelUrl)}
                />

                <TouchableOpacity style={styles.actionBtn} onPress={handleSaveSede}>
                  <Text style={styles.actionBtnText}>
                    {editingId ? 'Actualizar Sede' : 'Guardar Sede Permanentemente'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Servicios Recientes</Text>
            {loadingMedia ? (
              <ActivityIndicator size="small" color="#00ffcc" />
            ) : (
              pastServices.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSub}>
                    {item.speaker || selectedSede?.nombre || 'Sede'} • {item.duration || 'Video'}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* PETICIONES DE ORACIÓN */}
        {activeTab === 'prayers' && (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Peticiones de Oración Congregacional</Text>
            <View style={styles.formGroup}>
              <TextInput 
                style={styles.input} 
                placeholder="Escribe tu petición de oración..." 
                placeholderTextColor="#666"
                value={newPrayer} 
                onChangeText={setNewPrayer}
              />
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

        {/* GESTIÓN DE COMITÉS */}
        {activeTab === 'comites' && (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Comités de Trabajo e Iglesia</Text>

            {comitesList.map(comite => (
              <View key={comite.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{comite.nombre}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity 
                      style={styles.smallEditBtn} 
                      onPress={() => handleEditComiteClick(comite)}
                    >
                      <Text style={styles.smallEditText}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.smallDeleteBtn} 
                      onPress={() => handleDeleteComite(comite.id)}
                    >
                      <Text style={styles.smallDeleteText}>✕ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardSub}>{comite.descripcion || 'Sin descripción registrada'}</Text>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addSedeToggleBtn}
              onPress={() => {
                if (showComiteForm) {
                  setEditingComiteId(null);
                  setNewComiteName('');
                  setNewComiteDesc('');
                }
                setShowComiteForm(!showComiteForm);
              }}
            >
              <Text style={styles.addSedeToggleText}>
                {showComiteForm ? '❌ Cancelar' : '➕ Crear Nuevo Comité'}
              </Text>
            </TouchableOpacity>

            {showComiteForm && (
              <View style={styles.addSedeCard}>
                <Text style={styles.cardTitle}>
                  {editingComiteId ? '✏️ Modificar Comité' : '➕ Registrar Nuevo Comité'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del Comité"
                  placeholderTextColor="#666"
                  value={newComiteName}
                  onChangeText={setNewComiteName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Descripción o funciones del comité"
                  placeholderTextColor="#666"
                  value={newComiteDesc}
                  onChangeText={setNewComiteDesc}
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

        {/* TESORERÍA / FINANZAS */}
        {activeTab === 'finance' && (
          <ScrollView style={styles.content}>
            <Text style={styles.centeredSectionTitle}>Diezmos - Ofrendas y donaciones</Text>
            
            <View style={styles.metricContainer}>
              {financeList.map(item => (
                <View key={item.id} style={styles.metricCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.metricLabel}>{item.label}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity onPress={() => handleEditFinanceClick(item)} style={{ marginRight: 6 }}>
                        <Text style={{ fontSize: 12 }}>✏️</Text>
                      </TouchableOpacity>
                      {financeList.length > 1 && (
                        <TouchableOpacity onPress={() => handleDeleteFinance(item.id)}>
                          <Text style={{ fontSize: 12, color: '#ff0055', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: item.color || '#00ffcc' }]}>{item.amount}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.addSedeToggleBtn}
              onPress={() => {
                if (showFinanceForm) {
                  setEditingFinanceId(null);
                  setNewFinanceLabel('');
                  setNewFinanceAmount('');
                }
                setShowFinanceForm(!showFinanceForm);
              }}
            >
              <Text style={styles.addSedeToggleText}>
                {showFinanceForm ? '❌ Cancelar' : '➕ Crear Nuevo Fondo / Métrica'}
              </Text>
            </TouchableOpacity>

            {showFinanceForm && (
              <View style={styles.addSedeCard}>
                <Text style={styles.cardTitle}>
                  {editingFinanceId ? '✏️ Modificar Fondo Financiero' : '➕ Registrar Nuevo Fondo'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del Fondo (Ej: Ofrendas Misioneras)"
                  placeholderTextColor="#666"
                  value={newFinanceLabel}
                  onChangeText={setNewFinanceLabel}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Monto o Valor (Ej: $ 1,500,000)"
                  placeholderTextColor="#666"
                  value={newFinanceAmount}
                  onChangeText={setNewFinanceAmount}
                />
                <TouchableOpacity style={styles.actionBtn} onPress={handleSaveFinance}>
                  <Text style={styles.actionBtnText}>
                    {editingFinanceId ? 'Actualizar Fondo' : 'Guardar Fondo'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.actionBtn, { marginTop: 14 }]}>
              <Text style={styles.actionBtnText}>💳 Registrar Diezmo o Donación</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* CALENDARIO DE CULTOS (2 MESES: NOVIEMBRE Y DICIEMBRE 2026) */}
        {activeTab === 'services' && (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>📅 Calendario de Cultos y Eventos (Nov - Dic 2026)</Text>
            <Text style={styles.cardSub}>Selecciona un día para ver o programar eventos:</Text>

            {/* Selector de Mes: Noviembre 2026 */}
            <Text style={[styles.cardTitle, { marginTop: 12 }]}>Noviembre 2026</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              {novDays.map((dayStr) => {
                const hasEvent = eventsList.some(e => e.date === dayStr);
                const isSelected = selectedDay === dayStr;
                return (
                  <TouchableOpacity 
                    key={dayStr}
                    style={[styles.dayBox, isSelected && styles.selectedDayBox, hasEvent && styles.hasEventBox]}
                    onPress={() => setSelectedDay(dayStr)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {dayStr.split('-')[2]}
                    </Text>
                    {hasEvent && <Text style={styles.dotIndicator}>•</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selector de Mes: Diciembre 2026 */}
            <Text style={[styles.cardTitle, { marginTop: 12 }]}>Diciembre 2026</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              {decDays.map((dayStr) => {
                const hasEvent = eventsList.some(e => e.date === dayStr);
                const isSelected = selectedDay === dayStr;
                return (
                  <TouchableOpacity 
                    key={dayStr}
                    style={[styles.dayBox, isSelected && styles.selectedDayBox, hasEvent && styles.hasEventBox]}
                    onPress={() => setSelectedDay(dayStr)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {dayStr.split('-')[2]}
                    </Text>
                    {hasEvent && <Text style={styles.dotIndicator}>•</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Eventos del Día Seleccionado */}
            <View style={styles.selectedDayHeader}>
              <Text style={styles.sectionTitle}>Eventos para el día: {selectedDay}</Text>
              <TouchableOpacity 
                style={styles.smallAddBtn}
                onPress={() => setShowEventForm(!showEventForm)}
              >
                <Text style={styles.smallAddText}>{showEventForm ? '✕ Cancelar' : '➕ Agregar Evento'}</Text>
              </TouchableOpacity>
            </View>

            {/* Formulario para agregar evento en este día */}
            {showEventForm && (
              <View style={styles.addSedeCard}>
                <Text style={styles.cardTitle}>Programar Culto / Evento el {selectedDay}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Título del Culto o Evento (Ej: Culto Especial)"
                  placeholderTextColor="#666"
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Hora (Ej: 7:00 PM)"
                  placeholderTextColor="#666"
                  value={newEventTime}
                  onChangeText={setNewEventTime}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Detalles / Predicador / Notas"
                  placeholderTextColor="#666"
                  value={newEventDetails}
                  onChangeText={setNewEventDetails}
                />
                <TouchableOpacity style={styles.actionBtn} onPress={handleSaveEvent}>
                  <Text style={styles.actionBtnText}>Guardar Evento en el Calendario</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Listado de eventos filtrados por la fecha seleccionada */}
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
                <Text style={[styles.cardSub, { textAlign: 'center' }]}>No hay cultos o eventos programados para este día.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' }, // Fondo oscuro espacial
  tabContainer: { flexDirection: 'row', backgroundColor: '#111827', maxHeight: 55, borderBottomWidth: 1, borderColor: '#1f2937' },
  tabButton: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#00ffcc' }, // Cian Neón Brillante
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  activeTabText: { color: '#00ffcc', fontWeight: 'bold' },
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
  liveBadge: { backgroundColor: '#3f0d12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ff0055' },
  liveBadgeText: { color: '#ff3366', fontSize: 11, fontWeight: 'bold' },
  offlineBadge: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  offlineBadgeText: { color: '#9ca3af', fontSize: 11, fontWeight: 'bold' },
  videoContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  emptyVideoBox: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyVideoText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  emptyVideoSubText: { color: '#9ca3af', fontSize: 11, textAlign: 'center' },
  addSedeToggleBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#00ffcc', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#111827' },
  addSedeToggleText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 13 },
  addSedeCard: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderColor: '#00ffcc', shadowColor: '#00ffcc', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  smallEditBtn: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#374151' },
  smallEditText: { color: '#00ffcc', fontSize: 11, fontWeight: 'bold' },
  smallDeleteBtn: { backgroundColor: '#3f0d12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#ff0055' },
  smallDeleteText: { color: '#ff0055', fontSize: 11, fontWeight: 'bold' },
  formGroup: { marginBottom: 16 },
  input: { backgroundColor: '#1f2937', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#374151', marginBottom: 8, color: '#ffffff', fontSize: 14 },
  actionBtn: { backgroundColor: '#00ffcc', padding: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#00ffcc', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#0b0f19', fontWeight: 'bold', fontSize: 14 },
  metricContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  metricCard: { width: '48%', backgroundColor: '#111827', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#1f2937', marginBottom: 10 },
  metricLabel: { fontSize: 12, color: '#9ca3af', flex: 1, fontWeight: '600' },
  metricValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  daysScroll: { flexDirection: 'row', marginVertical: 8 },
  dayBox: { width: 44, height: 48, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: '#1f2937', marginRight: 6 },
  selectedDayBox: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
  hasEventBox: { borderColor: '#ff0055', borderWidth: 2 },
  dayText: { fontSize: 14, fontWeight: 'bold', color: '#d1d5db' },
  selectedDayText: { color: '#0b0f19' },
  dotIndicator: { fontSize: 16, color: '#ff0055', fontWeight: 'bold', marginTop: -4 },
  selectedDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  smallAddBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  smallAddText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 12 }
});