import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, useImage, Image } from "@shopify/react-native-skia";
import { useWindowDimensions } from 'react-native';
import {useSharedValue, withTiming, Easing, withSequence, withRepeat} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function App() {
  const {width, height} = useWindowDimensions();
  const bg = useImage(require('./assets/sprites/background-day.png'));
  const bird = useImage(require('./assets/sprites/redbird-upflap.png'));
  const pipe = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const floor = useImage(require('./assets/sprites/base.png'));

  const x = useSharedValue(width - 50)

  useEffect (() => {
    x.value = 
    withRepeat ( 
      withSequence (
        withTiming(-150, {duration:3000, easing: Easing.linear}),
        withTiming(width, {duration: 0})
      ), -1
    )
  }, [])


  const pipeOffset = 0;
  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>

        <Image 
          image={bg} 
          width={width} 
          height={height} 
          fit={'cover'}
        />

        <Image
          image={pipe}
          y={height - 370 + pipeOffset}
          x={x}
          width={75}
          height={640}
        />

        <Image
          image={pipeTop}
          y={pipeOffset - 200}
          x={x}
          width={75}
          height={640}
        />

        <Image
          image={floor}
          width={width}
          height={150}
          y={height - 80}
          x={0}
          fit={'cover'}
        />

        <Image 
          image={bird}
          width={42}
          height={34}
          y={height / 2}
          x={width / 4}
          fit={'contain'}
        />

      </Canvas>
      <StatusBar style="auto" hidden={true}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {

  }
});
