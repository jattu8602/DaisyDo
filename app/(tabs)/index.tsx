import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
  Animated,
  Alert,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as DocumentPicker from 'expo-document-picker'
import { useRouter } from 'expo-router'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { supabase } from '@/lib/supabase'
import {
  TaskModal,
  NoteModal,
  MediaModal,
  DocumentModal,
} from '@/components/TaskOptions'

// Task type definition
type Task = {
  id: string
  title: string
  description?: string
  time?: string
  color: string
  has_reminder?: boolean
  reminder_time?: string
  reminder_frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  reminder_end_date?: string
  voice_note_url?: string
  priority: 'high' | 'medium' | 'low'
  is_completed?: boolean
  year: number
  month: number
  day: number
  is_daily?: boolean
  is_routine?: boolean
  attachment_url?: string
  start_date?: string
}

// Define the day type for better TypeScript support
type CalendarDay = {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isSelected?: boolean
  hasEvents?: boolean
}

const CalendarScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    priority: 'medium',
    is_daily: false,
    color: '#FF3B30',
    has_reminder: false,
    is_routine: false
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [years] = useState(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)
  })
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [fabOpen, setFabOpen] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [note, setNote] = useState({ title: '', description: '' })
  const [mediaCaption, setMediaCaption] = useState('')
  const [documentCaption, setDocumentCaption] = useState('')

  const animation = useRef(new Animated.Value(0)).current
  const router = useRouter()

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    setTasks(data || [])
  }

  // Generate calendar days
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)

    // Previous month days
    const prevMonthDays = []
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevMonthYear)

    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrevMonth - firstDay + i + 1
      prevMonthDays.push({
        day,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      })
    }

    // Current month days
    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true,
        isSelected: i === selectedDay,
      })
    }

    // Next month days
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
    const nextMonthYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
    const totalDaysShown = 42 // 6 rows of 7 days
    const remainingDays =
      totalDaysShown - prevMonthDays.length - currentMonthDays.length

    const nextMonthDays = []
    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      })
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
  }

  const days = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDay(day.day)
    setSelectedMonth(day.month)
    setSelectedYear(day.year)
    router.push('/tasks')
  }

  const getFilteredTasks = () => {
    return tasks
      .filter((task) => {
        if (task.is_routine) {
          return true
        } else {
          return (
            task.year === selectedYear &&
            task.month === selectedMonth &&
            task.day === selectedDay
          )
        }
      })
      .sort((a, b) => {
        // First sort by routine tasks
        if (a.is_routine && !b.is_routine) return -1
        if (!a.is_routine && b.is_routine) return 1

        // Then sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }

  const getTaskColor = (task: Task) => {
    if (task.is_routine) return '#A8D8EA' // Pastel blue for routine tasks
    switch (task.priority) {
      case 'high':
        return '#FFB5B5' // Pastel red for high priority
      case 'medium':
        return '#FFD4B2' // Pastel orange for medium priority
      case 'low':
        return '#FFF6B5' // Pastel yellow for low priority
      default:
        return '#FFB5B5'
    }
  }

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={[styles.taskColorBar, { backgroundColor: getTaskColor(item) }]} />
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <ThemedText style={styles.taskTitle}>{item.title}</ThemedText>
          {item.is_routine && (
            <View style={styles.routineBadge}>
              <Ionicons name="repeat" size={16} color="#007AFF" />
              <ThemedText style={styles.routineText}>Routine</ThemedText>
            </View>
          )}
        </View>
        {item.time && (
          <View style={styles.taskMeta}>
            <ThemedText style={styles.taskTime}>{item.time}</ThemedText>
            {item.has_reminder && (
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#777"
                style={styles.taskIcon}
              />
            )}
            {item.voice_note_url && (
              <Ionicons
                name="mic"
                size={16}
                color="#777"
                style={styles.taskIcon}
              />
            )}
          </View>
        )}
      </View>
    </View>
  )

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <ThemedText style={styles.monthYearText}>
        {monthNames[selectedMonth]}, {selectedYear}
      </ThemedText>
    </View>
  )

  const renderYearPicker = () => (
    <Modal visible={showYearPicker} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={(value) => {
              setSelectedYear(value)
              setShowYearPicker(false)
            }}
          >
            {years.map((year) => (
              <Picker.Item key={year} label={year.toString()} value={year} />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  )

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false)
    if (selectedDate) {
      setSelectedTime(selectedDate)
      setNewTask({
        ...newTask,
        time: selectedDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }
  }

  const handleAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]
      if (!file) return

      // Create a unique file path with user's ID
      const fileExt = file.name.split('.').pop() || 'file'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${selectedYear}/${selectedMonth}/${selectedDay}/${fileName}`

      // Create a FormData object for the file
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any)

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, formData)

      if (error) {
        console.error('Error uploading file:', error)
        return
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from('attachments').getPublicUrl(filePath)

      setNewTask({
        ...newTask,
        attachment_url: publicUrl || '',
      })
    } catch (error) {
      console.error('Error picking document:', error)
    }
  }

  const handleSaveTask = async (task: Partial<Task>) => {
    try {
      if (!task.title) {
        Alert.alert('Error', 'Task title is required')
        return
      }

      const taskToSave = {
        ...task,
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay,
        is_completed: false,
        priority: task.priority || 'medium',
        color: task.color || '#FF3B30',
        has_reminder: task.has_reminder || false,
        is_routine: task.is_routine || false,
        attachment_url: task.attachment_url || null,
        reminder_time: task.reminder_time || null,
        time: task.time || null
      }

      const { error } = await supabase.from('tasks').insert([taskToSave])

      if (error) {
        console.error('Error saving task:', error)
        Alert.alert('Error', 'Failed to save task. Please try again.')
        return
      }

      setShowTaskModal(false)
      setNewTask({
        title: '',
        priority: 'medium',
        is_daily: false,
        color: '#FF3B30',
        has_reminder: false,
        is_routine: false,
        attachment_url: undefined,
        reminder_time: undefined,
        time: undefined
      })
      fetchTasks()
    } catch (error) {
      console.error('Error saving task:', error)
      Alert.alert('Error', 'Failed to save task. Please try again.')
    }
  }

  const handleSaveNote = (note: { title: string; description: string }) => {
    // Save note logic - would be implemented with Supabase
    Alert.alert('Note Saved', 'Your note has been saved successfully')
    setShowNoteModal(false)
  }

  const handleSaveMedia = (media: { caption: string; assets: any[] }) => {
    // Save media logic - would be implemented with Supabase
    Alert.alert('Media Saved', 'Your media has been uploaded successfully')
    setShowMediaModal(false)
  }

  const handleSaveDocument = (doc: { caption: string; files: any[] }) => {
    // Save document logic - would be implemented with Supabase
    Alert.alert(
      'Documents Saved',
      'Your documents have been uploaded successfully'
    )
    setShowDocumentModal(false)
  }

  const renderModals = () => (
    <>
      <TaskModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={handleSaveTask}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        task={newTask}
        setTask={setNewTask}
        monthNames={monthNames}
        weekDays={weekDays}
        days={days}
      />

      <NoteModal
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
      />

      <MediaModal
        visible={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSave={handleSaveMedia}
      />

      <DocumentModal
        visible={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
      />
    </>
  )

  // Toggle FAB menu
  const toggleFabMenu = () => {
    const toValue = fabOpen ? 0 : 1
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start()
    setFabOpen(!fabOpen)
  }

  // Animation values for rotating + to X
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  })

  // Animation values for menu items
  const taskButtonTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  })

  const noteButtonTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -160],
  })

  const mediaButtonTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -240],
  })

  const documentButtonTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -320],
  })

  // Opacity animation
  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  })

  const getDayCellStyle = (isCurrentDay: boolean | undefined, isSelected: boolean | undefined): ViewStyle => {
    if (isCurrentDay && isSelected) {
      return { backgroundColor: '#90CAF9' } as ViewStyle;
    }
    if (isCurrentDay) {
      return { backgroundColor: '#E3F2FD' } as ViewStyle;
    }
    if (isSelected) {
      return { backgroundColor: '#BBDEFB' } as ViewStyle;
    }
    return {} as ViewStyle;
  };

  const getDayTextStyle = (isCurrentDay: boolean | undefined, isSelected: boolean | undefined): TextStyle => {
    if (isCurrentDay && isSelected) {
      return { color: '#0D47A1' } as TextStyle;
    }
    if (isCurrentDay) {
      return { color: '#1976D2' } as TextStyle;
    }
    if (isSelected) {
      return { color: '#0D47A1' } as TextStyle;
    }
    return {} as TextStyle;
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      {/* Month Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthSelector}
      >
        {monthNames.map((month, index) => (
          <TouchableOpacity
            key={month}
            style={[
              styles.monthButton,
              selectedMonth === index && styles.selectedMonth
            ]}
            onPress={() => setSelectedMonth(index)}
          >
            <ThemedText style={[
              styles.monthText,
              selectedMonth === index && styles.selectedMonthText
            ]}>
              {month}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Year Selector */}
      <TouchableOpacity
        style={styles.yearSelector}
        onPress={() => setShowYearPicker(true)}
      >
        <ThemedText style={styles.yearText}>{selectedYear}</ThemedText>
        <Ionicons name="chevron-down" size={16} color="#333" />
      </TouchableOpacity>

      {showYearPicker && (
        <View style={styles.yearPicker}>
          <ScrollView>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearOption,
                  selectedYear === year && styles.selectedYear
                ]}
                onPress={() => {
                  setSelectedYear(year)
                  setShowYearPicker(false)
                }}
              >
                <ThemedText style={[
                  styles.yearOptionText,
                  selectedYear === year && styles.selectedYearText
                ]}>
                  {year}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.calendarCard}>
        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <ThemedText style={styles.weekDayText}>{day}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <ThemedText style={styles.weekDayText}>{day}</ThemedText>
            </View>
          ))}
          {days.map((day, index) => {
            const isSelected = day.day === selectedDay && day.month === selectedMonth && day.year === selectedYear;
            const cellStyle = [
              styles.dayCell,
              day.isCurrentMonth && styles.currentMonthDay,
              !day.isCurrentMonth && styles.otherMonthDay,
              isSelected && styles.selectedDay
            ];
            const textStyle = [
              styles.dayText,
              day.isCurrentMonth && styles.currentMonthText,
              !day.isCurrentMonth && styles.otherMonthText,
              isSelected && styles.selectedDayText
            ];

            return (
              <TouchableOpacity
                key={index}
                style={cellStyle}
                onPress={() => handleDayPress(day)}
              >
                <Text style={textStyle}>
                  {day.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={getFilteredTasks()}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.tasksList}
      />

      {/* FAB Menu */}
      <View style={styles.fabContainer}>
        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: taskButtonTranslateY }],
              opacity: opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => {
              setShowTaskModal(true)
              setFabOpen(false)
              Animated.spring(animation, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
              }).start()
            }}
          >
            <Ionicons name="list" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: noteButtonTranslateY }],
              opacity: opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#FF9500' }]}
            onPress={() => {
              setShowNoteModal(true)
              setFabOpen(false)
              Animated.spring(animation, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
              }).start()
            }}
          >
            <Ionicons name="document-text" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: mediaButtonTranslateY }],
              opacity: opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#FFD60A' }]}
            onPress={() => {
              setShowMediaModal(true)
              setFabOpen(false)
              Animated.spring(animation, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
              }).start()
            }}
          >
            <Ionicons name="image" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: documentButtonTranslateY }],
              opacity: opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#007AFF' }]}
            onPress={() => {
              setShowDocumentModal(true)
              setFabOpen(false)
              Animated.spring(animation, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
              }).start()
            }}
          >
            <Ionicons name="folder" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.fab} onPress={toggleFabMenu}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={32} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Render Modals */}
      {renderModals()}
    </ThemedView>
  )
}

export default CalendarScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#FFF8F0',
    paddingTop: 30,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#103783',
  },
  headerSubtitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#103783',
  },
  calendarCard: {
    margin: 16,
    backgroundColor: '#E6F4FF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  monthSelector: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedMonth: {
    backgroundColor: '#74b9ff',
  },
  monthText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMonthText: {
    color: 'white',
    fontWeight: 'bold',
  },
  yearSelector: {
    position: 'absolute',
    top: 10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  yearPicker: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 200,
    width: 100,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  yearOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedYear: {
    backgroundColor: '#74b9ff',
  },
  yearOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedYearText: {
    color: 'white',
    fontWeight: 'bold',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tasksList: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#F2F8FF',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskColorBar: {
    width: 5,
    backgroundColor: '#8e44ad',
  },
  taskContent: {
    flex: 1,
    padding: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 14,
    color: '#777',
    marginRight: 8,
  },
  taskIcon: {
    marginRight: 8,
  },
  taskFlag: {
    justifyContent: 'center',
    paddingRight: 12,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
  },
  fabItem: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    width: 160,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fabItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  captionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  taskModalContent: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  dateSelectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  yearMonthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 10,
  },
  yearButtonText: {
    fontSize: 16,
    marginRight: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 10,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  priorityButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPriority: {
    backgroundColor: '#74b9ff',
    borderColor: '#74b9ff',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  timeButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  attachmentButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#74b9ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timePicker: {
    width: '100%',
    height: 200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedDay: {
    backgroundColor: '#74b9ff',
    borderRadius: 8,
  },
  currentMonthDay: {
    backgroundColor: 'white',
  },
  otherMonthDay: {
    color: '#aaa',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  routineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8D8EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routineText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentMonthText: {
    color: '#1976D2',
  },
  otherMonthText: {
    color: '#aaa',
  },
})
