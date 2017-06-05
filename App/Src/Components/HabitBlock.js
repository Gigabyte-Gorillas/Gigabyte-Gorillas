import React, { PropTypes } from 'react'
import { Text, View, StyleSheet, Dimensions } from 'react-native';
import RecentDays from './RecentDays.js'

const HabitBlock = ({habit, allHabits, onPressItem, onPressHabit}) => {
  const habitProps = habit;

  console.log('habitprops', habitProps);

  return (
    <View style={styles.habitBlock}>
      <View style={styles.habitName}>
        <Text onPress={() => onPressHabit(habitProps)} style={styles.habitNameTitle}>{habit.name}</Text>
      </View>
      <RecentDays allHabits={allHabits} dates={habit.dates} habitProps={habitProps} onPressItem={onPressItem}/>
    </View>
  )
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  habitBlock: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'skyblue',
    marginBottom: 10,
  },

  habitName: {
    alignItems: 'center',
    backgroundColor: 'salmon',
    width: width,
  },

  habitNameTitle: {
    color: 'white',
  },
})

export default HabitBlock
