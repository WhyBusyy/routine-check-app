import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const PARTICLE_COUNT = 30
const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#fbbf24']

type Props = {
  visible: boolean
  onDone?: () => void
}

function createParticle() {
  return {
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 300,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
  }
}

export default function Confetti({ visible, onDone }: Props) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, createParticle)
  ).current
  const anims = useRef(
    particles.map(() => new Animated.Value(0))
  ).current

  useEffect(() => {
    if (!visible) return

    const animations = anims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(particles[i].delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200 + Math.random() * 600,
          useNativeDriver: true,
        }),
      ])
    )

    Animated.parallel(animations).start(() => {
      anims.forEach((a) => a.setValue(0))
      onDone?.()
    })
  }, [visible])

  if (!visible) return null

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SCREEN_HEIGHT + 20],
        })
        const translateX = anims[i].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120],
        })
        const opacity = anims[i].interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        })
        const rotate = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
        })

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.size / 2,
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
    top: -10,
  },
})
