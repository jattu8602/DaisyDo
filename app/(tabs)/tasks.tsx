import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '@supabase/supabase-js'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

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
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [selectedDate])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('year', selectedDate.getFullYear())
      .eq('month', selectedDate.getMonth())
      .eq('day', selectedDate.getDate())
      .or('isDaily.eq.true')

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    setTasks(data || [])
  }

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task:', error)
      return
    }

    fetchTasks()
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '#ff7675'
      case 'medium':
        return '#ffeaa7'
      case 'low':
        return '#a29bfe'
      default:
        return '#74b9ff'
    }
  }

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleTaskCompletion(item.id)}
      >
        <Ionicons
          name={item.is_completed ? 'checkbox' : 'square-outline'}
          size={24}
          color={item.is_completed ? '#4CAF50' : '#666'}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <ThemedText
          style={[
            styles.taskTitle,
            item.is_completed && styles.completedTask
          ]}
        >
          {item.title}
        </ThemedText>

        {item.time && (
          <View style={styles.taskMeta}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <ThemedText style={styles.taskTime}>{item.time}</ThemedText>
          </View>
        )}

        {item.description && (
          <ThemedText style={styles.taskNotes}>{item.description}</ThemedText>
        )}
      </View>

      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
    </View>
  )

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Today's Tasks</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.taskList}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTime: {
    marginLeft: 4,
    color: '#666',
  },
  taskNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
})
