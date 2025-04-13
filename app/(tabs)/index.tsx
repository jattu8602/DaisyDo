import React, { useState, useEffect } from 'react'
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
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as DocumentPicker from 'expo-document-picker'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { supabase } from '@/lib/supabase'

// Task type definition
type Task = {
  id: string
  title: string
  time?: string
  color: string
  has_reminder?: boolean
  has_attachment?: boolean
  priority: 'high' | 'medium' | 'low'
  notes?: string
  is_daily?: boolean
  end_date?: string
  is_completed?: boolean
  year: number
  month: number
  day: number
  reminder_frequency?: string
  attachment_url?: string
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
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedTime, setSelectedTime] = useState(new Date())

  // Generate years for picker
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const yearsArray = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)
    setYears(yearsArray)
    fetchTasks()
  }, [selectedYear, selectedMonth])

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
        hasEvents: [11, 12, 23].includes(i), // Days with dot indicators
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

  const renderDay = (day: CalendarDay, index: number) => {
    const textColor = day.isCurrentMonth
      ? day.isSelected
        ? 'white'
        : 'black'
      : '#aaa'
    const backgroundColor = day.isSelected ? '#74b9ff' : 'transparent'

    return (
      <View key={index} style={styles.dayCell}>
        <View style={[styles.dayContainer, { backgroundColor }]}>
          <ThemedText style={[styles.dayText, { color: textColor }]}>
            {day.day}
          </ThemedText>
          {day.hasEvents && (
            <View style={styles.dotContainer}>
              <View style={styles.dot} />
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderWeekDay = (day: string) => (
    <View key={day} style={styles.weekDayCell}>
      <ThemedText style={styles.weekDayText}>{day}</ThemedText>
    </View>
  )

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={[styles.taskColorBar, { backgroundColor: item.color }]} />
      <View style={styles.taskContent}>
        <ThemedText style={styles.taskTitle}>{item.title}</ThemedText>
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
            {item.has_attachment && (
              <Ionicons
                name="attach"
                size={16}
                color="#777"
                style={styles.taskIcon}
              />
            )}
          </View>
        )}
      </View>
      <View style={styles.taskFlag}>
        {item.id === '2' && (
          <Ionicons name="flag-outline" size={18} color="#777" />
        )}
        {item.id === '3' && (
          <Ionicons name="flag-outline" size={18} color="#777" />
        )}
      </View>
    </View>
  )

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <TouchableOpacity onPress={() => setShowYearPicker(true)}>
        <ThemedText style={styles.yearText}>{selectedYear}</ThemedText>
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthScroll}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.monthButton,
              selectedMonth === i && styles.selectedMonth
            ]}
            onPress={() => setSelectedMonth(i)}
          >
            <ThemedText style={[
              styles.monthText,
              selectedMonth === i && styles.selectedMonthText
            ]}>
              {monthNames[i].substring(0, 3)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderYearPicker = () => (
    <Modal
      visible={showYearPicker}
      transparent
      animationType="slide"
    >
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
        time: selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

      // Create a FormData object for the file
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as any)

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${selectedYear}/${selectedMonth}/${selectedDay}/${fileName}`

      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, formData)

      if (error) throw error

      setNewTask({
        ...newTask,
        has_attachment: true,
        attachment_url: data.path,
      })
    } catch (error) {
      console.error('Error picking document:', error)
    }
  }

  const saveTask = async () => {
    const taskToSave = {
      ...newTask,
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
      is_completed: false,
    }

    const { error } = await supabase.from('tasks').insert([taskToSave])

    if (error) {
      console.error('Error saving task:', error)
      return
    }

    setShowTaskModal(false)
    setNewTask({ priority: 'medium', is_daily: false })
    fetchTasks()
  }

  const renderTaskModal = () => (
    <Modal
      visible={showTaskModal}
      transparent
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.taskModalContent}>
          <ThemedText style={styles.modalTitle}>Add New Task</ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Task Title"
            value={newTask.title}
            onChangeText={(text) => setNewTask({ ...newTask, title: text })}
          />

          <View style={styles.priorityContainer}>
            <ThemedText>Priority:</ThemedText>
            <View style={styles.priorityButtons}>
              {['high', 'medium', 'low'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    newTask.priority === priority && styles.selectedPriority
                  ]}
                  onPress={() => setNewTask({ ...newTask, priority: priority as Task['priority'] })}
                >
                  <ThemedText>{priority}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#666" />
            <ThemedText style={styles.timeButtonText}>
              {newTask.time || 'Set Time'}
            </ThemedText>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              onChange={handleTimeChange}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={true}
            />
          )}

          <View style={styles.switchContainer}>
            <ThemedText>Daily Task</ThemedText>
            <Switch
              value={newTask.is_daily}
              onValueChange={(value) => setNewTask({ ...newTask, is_daily: value })}
            />
          </View>

          {newTask.is_daily && (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                // Implement date picker for end date
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <ThemedText style={styles.dateButtonText}>
                {newTask.end_date || 'Set End Date'}
              </ThemedText>
            </TouchableOpacity>
          )}

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
            multiline
            value={newTask.notes}
            onChangeText={(text) => setNewTask({ ...newTask, notes: text })}
          />

          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={handleAttachment}
          >
            <Ionicons name="attach-outline" size={20} color="#666" />
            <ThemedText style={styles.attachmentButtonText}>
              {newTask.has_attachment ? 'Change Attachment' : 'Add Attachment'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveTask}
          >
            <ThemedText style={styles.saveButtonText}>Save Task</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      {renderMonthSelector()}
      {renderYearPicker()}
      {renderTaskModal()}

      <View style={styles.calendarCard}>
        <View style={styles.monthSelector}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#555" />
          </TouchableOpacity>
          <ThemedText style={styles.monthYearText}>NOV, 2022</ThemedText>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>
          <View style={styles.monthControls}>
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={24} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={24} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => renderWeekDay(day))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((day, index) => renderDay(day, index))}
          </View>
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.tasksList}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowTaskModal(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </ThemedView>
  )
}

export default CalendarScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#FFF8F0',
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
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  monthControls: {
    flexDirection: 'row',
    gap: 10,
  },
  calendar: {
    padding: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayContainer: {
    width: '80%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  dayText: {
    fontSize: 18,
    fontWeight: '500',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#74b9ff',
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 16,
  },
  monthScroll: {
    flex: 1,
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
  },
  selectedMonthText: {
    color: 'white',
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
})
