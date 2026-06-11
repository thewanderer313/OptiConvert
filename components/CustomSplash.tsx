import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

interface Props {
  onFinish: () => void;
  visibleMs?: number;
  fadeMs?: number;
}

export default function CustomSplash({
  onFinish,
  visibleMs = 1500,
  fadeMs = 300,
}: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeMs,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, visibleMs);
    return () => clearTimeout(timer);
  }, [opacity, visibleMs, fadeMs, onFinish]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { opacity }]}
      pointerEvents="none"
    >
      <Image
        source={require('../assets/OCSplash.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1B2A4A',
    zIndex: 9999,
    elevation: 9999,
  },
});
