import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Group, Canvas, useImage, Image } from "@shopify/react-native-skia";
import { useWindowDimensions } from 'react-native';
import { useSharedValue, withTiming, Easing, withSequence, withRepeat, useFrameCallback, useDerivedValue, interpolate } from 'react-native-reanimated';
import { useEffect } from 'react';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

const gravity = 1000;
const jump = -450

export default function App() {
  const {width, height} = useWindowDimensions();
  const bg = useImage(require('./assets/sprites/bg.png'));
  const penguin = useImage(require('./assets/sprites/penguin-mid.png'));
  const pipe = useImage(require('./assets/sprites/pipe-bottom.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-top.png'));
  const floor = useImage(require('./assets/sprites/floor.png'));

  const x = useSharedValue(width - 10);
  const penguinYpos = useSharedValue(height/3);
  const penguinVelocity = useSharedValue(100);
  const penguinTransform = useDerivedValue(() => {
    return [{rotate: interpolate(penguinVelocity.value, [jump, -jump], [-0.5, 0.5])}];
  })
  const penguinOrigin = useDerivedValue(() => {
    return {x:width/6 + 47.5, y: penguinYpos.value + 47.5}
  })

   useFrameCallback(({timeSincePreviousFrame: dt})=>{
     if (!dt){
       return;
     }
     penguinYpos.value = penguinYpos.value + (penguinVelocity.value * dt)/1000;
     penguinVelocity.value = penguinVelocity.value + (gravity * dt)/1000;

   });

   useEffect (() => {
     x.value = 
     withRepeat ( 
       withSequence (
         withTiming(-200, {duration:3000, easing: Easing.linear}),
         withTiming(width, {duration: 0})
       ), -1
     )
   }, [])

  const gesture = Gesture.Tap().onStart(() => {
    penguinVelocity.value = jump
  })

  const pipeOffset = 0;

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width, height }}>

            <Image 
              image={bg} 
              width={width} 
              height={height- 70} 
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

            <Group transform={penguinTransform}
            origin={penguinOrigin}>
              <Image 
                image={penguin}
                width={95}
                height={95}
                y={penguinYpos}
                x={width / 6}
                fit={'contain'}
              />
            </Group>
          </Canvas>
        </GestureDetector>
        <StatusBar style="auto" hidden={true}/>
      </GestureHandlerRootView>
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
