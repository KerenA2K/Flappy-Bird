import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Group, Canvas, useImage, Image, Text, useFont } from "@shopify/react-native-skia";
import { useWindowDimensions } from 'react-native';
import { 
  useSharedValue, 
  withTiming, 
  Easing, 
  withSequence, 
  withRepeat, 
  useFrameCallback, 
  useDerivedValue, 
  interpolate, 
  useAnimatedReaction, 
  runOnJS,
  cancelAnimation } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

const gravity = 1000;
const jump = -450

export default function App() {
  const [score, setScore] = useState(0);
  const {width, height} = useWindowDimensions();
  const bg = useImage(require('./assets/sprites/bg.png'));
  const penguin = useImage(require('./assets/sprites/penguin-mid.png'));
  const pipe = useImage(require('./assets/sprites/pipe-bottom.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-top.png'));
  const floor = useImage(require('./assets/sprites/floor.png'));
  const font = useFont(require("./assets/fonts/Game-Regular.ttf"), 40);
  const gameOver = useSharedValue(false);

  const x = useSharedValue(width - 10); //Shared value for animation
  const penguinYpos = useSharedValue(height/3);
  const penguinXpos = width / 4;
  const penguinVelocity = useSharedValue(100);

  //Loop pipes
  useEffect (() => {
    pipeMovement();
   }, []);

  const pipeMovement = () => {
    x.value = //x value of pipes
    withRepeat ( 
      withSequence (
        withTiming(-200, {duration:3000, easing: Easing.linear}), //from right to left (-200) - 3s time
        withTiming(width, {duration: 0}) //Goes back right (max width of screen) 0 = instant
      ), -1 //withRepeat -1 = infinite
    )
  }
     
     //Scoring
     useAnimatedReaction(
      () => x.value, //x value of pipes
      (currentValue, previousValue) => {
        const penguinPassed = penguinXpos
        if (currentValue !== previousValue &&  //current pipe not equal to previous
           previousValue &&                    //previous value should exist
           currentValue <= penguinPassed &&    //if current pipe = penguin pos or left side
           previousValue > penguinPassed)      //if previous pipe passed penguin
        {           
            runOnJS(setScore)(score + 1);
        }
      }
    );
  
    //Collision
    useAnimatedReaction(
      () => penguinYpos.value,
      (currentValue, previousValue) => {
        if (currentValue > height - 140)
        {
          gameOver.value = true;
          cancelAnimation(x);
        }
      }
      );
    
      //GameOver
      useAnimatedReaction(
        () => gameOver.value,
        (currentValue, previousValue) => {
          if (currentValue && !previousValue)
          {
            cancelAnimation(x);
          }
        }
      );

    //Penguin falling physics
    useFrameCallback(({timeSincePreviousFrame: dt})=>{ //called on every frame
      if (!dt || gameOver.value){
        return;
      }
      penguinYpos.value = penguinYpos.value + (penguinVelocity.value * dt)/1000; //Penguin Y pos - based on velocity to jump or fall
      penguinVelocity.value = penguinVelocity.value + (gravity * dt)/1000;       //Minus Velocity to fall
 
    });

   const restartGame = () => {  //reset all values
    'worklet';
    penguinYpos.value = height/3;
    penguinVelocity.value = 0;
    gameOver.value = false;
    x.value = width;
    runOnJS(pipeMovement)();
    runOnJS(setScore)(0);  //runOnJS to update state on animation or within gesture
  }

  //Penguin jump physics
  const gesture = Gesture.Tap().onStart(() => { //onTap
    if (gameOver.value) {   //if gameover - restart
      restartGame();
    } else {
    penguinVelocity.value = jump      //Add velocity (opposite sign to gravity - to go up)
    }
  })

  const penguinTransform = useDerivedValue(() => { //Using calculated value
    return [
      { rotate: interpolate(penguinVelocity.value,  //map value in range
       [jump, -jump], //when bird: jump -> fall
       [-5, 0.5])   //will rotate: -5 -> 0.5
      }
    ];
  })

  const penguinOrigin = useDerivedValue(() => {
    return {x:penguinXpos + 47.5, y: penguinYpos.value + 47.5}
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
                x={penguinXpos}
                fit={'contain'}
              />
            </Group>

            <Text 
            x={width/2} 
            y={100} 
            text={score.toString()}
            font={font}/>
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
});
