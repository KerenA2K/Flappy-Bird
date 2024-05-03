import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, useImage, Image } from "@shopify/react-native-skia";
import { useWindowDimensions } from 'react-native';
import {useSharedValue, withTiming, Easing, withSequence, withRepeat, useFrameCallback} from 'react-native-reanimated';
import { useEffect } from 'react';

const gravity = 300;

export default function App() {
  const {width, height} = useWindowDimensions();
  const bg = useImage(require('./assets/sprites/bg.png'));
  const penguin = useImage(require('./assets/sprites/penguin-mid.png'));
  const pipe = useImage(require('./assets/sprites/pipe-bottom.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-top.png'));
  const floor = useImage(require('./assets/sprites/floor.png'));

  const x = useSharedValue(width - 10);
  const penguinYpos = useSharedValue(height/2);
  const penguinVelocity = useSharedValue(100);
  
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


  const pipeOffset = 0;
  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }} onTouch={() => (penguinVelocity.value = -200)}>

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

        <Image 
          image={penguin}
          width={95}
          height={95}
          y={penguinYpos}
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
