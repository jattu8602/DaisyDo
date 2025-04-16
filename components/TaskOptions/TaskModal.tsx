import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Platform,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { ThemedText } from '@/components/ThemedText'

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

// CalendarDay type
type CalendarDay = {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isSelected?: boolean
  hasEvents?: boolean
}

type TaskModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => void
  selectedYear: number
  selectedMonth: number
  selectedDay: number
  task: Partial<Task>
  setTask: (task: Partial<Task>) => void
  monthNames: string[]
  weekDays: string[]
  days: CalendarDay[]
}

const TaskModal = ({
  visible,
  onClose,
  onSave,
  selectedYear,
  selectedMonth,
  selectedDay,
  task,
  setTask,
  monthNames,
  weekDays,
  days,
}: TaskModalProps) => {
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [selectedReminderTime, setSelectedReminderTime] = useState(new Date())

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false)
    if (selectedDate) {
      setSelectedTime(selectedDate)
      setTask({
        ...task,
        time: selectedDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      })
    }
  }

  const handleReminderTimeChange = (event: any, selectedDate?: Date) => {
    setShowReminderTimePicker(false)
    if (selectedDate) {
      setSelectedReminderTime(selectedDate)
      setTask({
        ...task,
        reminder_time: selectedDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      })
    }
  }

  const handleSaveTask = () => {
    if (!task.title) {
      Alert.alert('Error', 'Please enter a task title')
      return
    }

    const taskToSave: Partial<Task> = {
      ...task,
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
      is_completed: false,
      priority: task.priority || 'medium',
      color: task.color || '#FF3B30',
      has_reminder: task.has_reminder || false,
      is_routine: task.is_routine || false,
      attachment_url: task.attachment_url,
      reminder_time: task.reminder_time,
      time: task.time
    }

    onSave(taskToSave)
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.taskModalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add New Task</ThemedText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Date Display */}
            <View style={styles.dateDisplay}>
              <ThemedText style={styles.dateText}>
                {formatDate(new Date(selectedYear, selectedMonth, selectedDay))}
              </ThemedText>
            </View>

            {/* Task Title Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="What do you need to get done?"
                value={task.title}
                onChangeText={(text) => setTask({ ...task, title: text })}
                placeholderTextColor="#999"
              />
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Time</ThemedText>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.timeButtonContent}>
                  <Ionicons name="time-outline" size={18} color="#FF3B30" />
                  <ThemedText style={styles.timeValue}>
                    {task.time || 'Set task time'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  onChange={handleTimeChange}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={false}
                />
              )}
            </View>

            {/* Priority Selection */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Priority</ThemedText>
              <View style={styles.priorityButtons}>
                {[
                  { value: 'high', label: 'High', color: '#FF3B30' },
                  { value: 'medium', label: 'Medium', color: '#FF9500' },
                  { value: 'low', label: 'Low', color: '#34C759' },
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      task.priority === priority.value && {
                        backgroundColor: priority.color,
                      },
                    ]}
                    onPress={() =>
                      setTask({
                        ...task,
                        priority: priority.value as Task['priority'],
                      })
                    }
                  >
                    <ThemedText
                      style={[
                        styles.priorityText,
                        task.priority === priority.value && styles.selectedPriorityText,
                      ]}
                    >
                      {priority.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reminder Settings */}
            <View style={styles.section}>
              <View style={styles.reminderHeader}>
                <ThemedText style={styles.reminderText}>Reminder</ThemedText>
                <Switch
                  value={task.has_reminder}
                  onValueChange={(value) =>
                    setTask({ ...task, has_reminder: value })
                  }
                  trackColor={{ false: '#E0E0E0', true: '#FF3B3050' }}
                  thumbColor={task.has_reminder ? '#FF3B30' : '#FFF'}
                />
              </View>

              {task.has_reminder && (
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowReminderTimePicker(true)}
                >
                  <View style={styles.timeButtonContent}>
                    <Ionicons name="time-outline" size={18} color="#FF3B30" />
                    <ThemedText style={styles.timeValue}>
                      {task.reminder_time || 'Set reminder time'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}
              {showReminderTimePicker && (
                <DateTimePicker
                  value={selectedReminderTime}
                  mode="time"
                  onChange={handleReminderTimeChange}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={false}
                />
              )}
            </View>

            {/* Routine Task */}
            <View style={styles.section}>
              <View style={styles.routineHeader}>
                <ThemedText style={styles.routineText}>Routine Task</ThemedText>
                <Switch
                  value={task.is_routine}
                  onValueChange={(value) =>
                    setTask({ ...task, is_routine: value })
                  }
                  trackColor={{ false: '#E0E0E0', true: '#FF3B3050' }}
                  thumbColor={task.is_routine ? '#FF3B30' : '#FFF'}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
              <ThemedText style={styles.saveButtonText}>Save Task</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  taskModalContent: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 12,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 45,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    height: '100%',
  },
  dateDisplay: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  priorityText: {
    fontSize: 13,
    color: '#555',
  },
  selectedPriorityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  reminderText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  routineText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
})

export default TaskModal
