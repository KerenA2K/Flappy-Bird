import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Group, Canvas, useImage, Image, Text, useFont, Circle, Rect } from "@shopify/react-native-skia";
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
import { Audio } from 'expo-av';

const gravity = 1000;
const jump = -450
const jumpSound = new Audio.Sound();
const collisionSound = new Audio.Sound();
const pipeWidth = 78;
const pipeHeight = 640;

export default function App() {
  const [score, setScore] = useState(0);
  const {width, height} = useWindowDimensions();
  const bg = useImage(require('./assets/sprites/bg.png'));
  const penguin = useImage(require('./assets/sprites/penguin-mid.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-bottom.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-top.png'));
  const floor = useImage(require('./assets/sprites/floor.png'));
  const font = useFont(require("./assets/fonts/Game-Regular.ttf"), 40);
  const gameOver = useSharedValue(false);
  
  const x = useSharedValue(width - 10); //Shared value is for animation
  const penguinYpos = useSharedValue(height/3);
  const penguinXpos = width / 4;
  const penguinVelocity = useSharedValue(100);
  const penguinCenterX = useDerivedValue (()=> penguinXpos + 47.5); //using calculated value
  const penguinCenterY = useDerivedValue (()=> penguinYpos.value + 47.5);
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(()=>pipeOffset.value - 255);
  const bottomPipeY = useDerivedValue(()=>height - 330 + pipeOffset.value);
  const obstacles = useDerivedValue(()=> {
    const listOfObstacles = [];
    //pipeTop
    listOfObstacles.push({
      x: x.value,
      y: pipeOffset.value - 270,
      h: pipeHeight,
      w: pipeWidth,
    });
    //pipeBottom
    listOfObstacles.push({
      x: x.value,
      y: height - 310 + pipeOffset.value,
      h: pipeHeight,
      w: pipeWidth,
    })
    return listOfObstacles;
  })
//-------------------------------LOAD SOUNDS-------------------------------
  useEffect(() => {
    async function loadSounds() {
      try {
        await jumpSound.loadAsync(require('./assets/jump.wav'));
        await collisionSound.loadAsync(require('./assets/collision1.wav'));
      } catch (error) {
        console.error('Error loading sounds', error);
      }
    }
    loadSounds();
    return () => {
      jumpSound.unloadAsync();
      collisionSound.unloadAsync();
    };
  }, []); 
  //-------------------------------PLAY SOUNDS-------------------------------
  const playJumpSound = () => {
    try {
      jumpSound.replayAsync();
    } catch (error) {
      console.error('Error playing sound', error);
    }
  };
  const playCollisionSound = () => {
    try {
      collisionSound.replayAsync();
    } catch (error) {
      console.error('Error playing collision sound', error);
    }
  };

  //-------------------------------LOOP PIPES-------------------------------
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
     
  //-------------------------------SCORING-------------------------------
  useAnimatedReaction(
    () => x.value, //x value of pipes
    (currentValue, previousValue) => {
      const penguinPassed = penguinXpos
      //Randomized pipe height after every score
      if (currentValue < -100 && previousValue > -100){
        pipeOffset.value = Math.random() * 400 - 200;
      }

      if (currentValue !== previousValue &&  //current pipe not equal to previous
         previousValue &&                    //previous value should exist
         currentValue <= penguinPassed &&    //if current pipe = penguin pos or left side
         previousValue > penguinPassed)      //if previous pipe passed penguin
      {           
          runOnJS(setScore)(score + 1);
      }
    }
  );
  
  //-------------------------------COLLISION-------------------------------
  const collisionDetection = (point, rect) => {
    'worklet';
    return (
      //bottom pipe - check react native collision detection for rectangle/square
      point.x >= rect.x &&   //right left-edge
      point.x <= rect.x + rect.w && //left right-edge
      point.y >= rect.y  && //below the top
      point.y <= rect.y + rect.h //above bottom
    );
  };


  useAnimatedReaction(
    () => penguinYpos.value,
    (currentValue, previousValue) => {
      //floor and top screen
      if (currentValue > height - 140 || currentValue < -50)
      {
        runOnJS(playCollisionSound)();
        gameOver.value = true;
      }
      
      //pipes
      const isColliding = obstacles.value.some((rect)=>
      collisionDetection({x:penguinCenterX.value, y: penguinCenterY.value}, rect));
      if(isColliding)
        {
          runOnJS(playCollisionSound)();
          gameOver.value = true;
        }
    }
    );
  
  //-------------------------------GAME OVER-------------------------------
  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue)
      {
        cancelAnimation(x);
      }
    }
  );

  //-------------------------------PENGUIN FALLING PHYSICS-------------------------------
  useFrameCallback(({timeSincePreviousFrame: dt})=>{ //called on every frame
    if (!dt || gameOver.value){
      return;
    }
    penguinYpos.value = penguinYpos.value + (penguinVelocity.value * dt)/1000; //Penguin Y pos - based on velocity to jump or fall
    penguinVelocity.value = penguinVelocity.value + (gravity * dt)/1000;       //Minus Velocity to fall
  });

  //-------------------------------RESTART GAME-------------------------------
   const restartGame = () => {  //reset all values
    'worklet';
    penguinYpos.value = height/3;
    penguinVelocity.value = 0;
    gameOver.value = false;
    x.value = width;
    runOnJS(pipeMovement)();
    runOnJS(setScore)(0);  //runOnJS to update state on animation or within gesture
  }

  //-------------------------------PENGUIN JUMP-------------------------------
  const gesture = Gesture.Tap().onStart(() => { //onTap
    if (gameOver.value) {   //if gameover - restart
      restartGame();
    } else {
    penguinVelocity.value = jump      //Add velocity (opposite sign to gravity - to go up)
    runOnJS(playJumpSound)();
  }
  })

  const penguinTransform = useDerivedValue(() => {
    return [
      { rotate: interpolate(penguinVelocity.value,  //map value in range
       [jump, -jump], //when bird: jump -> fall
       [-0.5, 0.5])   //will rotate: -5 -> 0.5
      }
    ];
  })

  const penguinOrigin = useDerivedValue(() => {
    return {x:penguinXpos + 47.5, y: penguinYpos.value + 47.5}
  })

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
              image={pipeBottom}
              y={bottomPipeY}
              x={x}
              width={pipeWidth}
              height={pipeHeight}
            />

            <Image
              image={pipeTop}
              y={topPipeY}
              x={x}
              width={pipeWidth}
              height={pipeHeight}
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
