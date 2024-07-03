import React, {useEffect, useRef, useState} from 'react';

import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import './App.css';
import { log } from '@tensorflow/tfjs';



const NOT_CHEATING = 'not_cheating';
const CHEATING = 'cheating';
const TRAINING_TIMES = 50;
const CONFIDENCE = 0.8;

function App() {
  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();
  const [cheated, setCheated] = useState(false);

  const init = async() => {
    console.log('init...');
    await setupCamera();

    console.log('setup camera success');

    // Create the classifier.
    classifier.current = knnClassifier.create();

    // Load mobilenet.
    mobilenetModule.current = await mobilenet.load();

    console.log('setup done');
    console.log('ko cham tay va bam train 1');
  
    
  }

  const setupCamera = () =>{
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

      if(navigator.getUserMedia){
        navigator.getUserMedia(
          {video: true},
          stream =>{
            video.current.srcObject = stream;
            video.current.addEventListener('loadeddata', resolve)
          },
          error => reject(error)
        );
      }else{
        reject()
      }
    });
  }

  const train = async label => {
    console.log(`[${label}] Training...`);
    for (let i = 0; i < TRAINING_TIMES; ++i){
      console.log(`Progress ${parseInt((i+1) / TRAINING_TIMES * 100)}%`);
      await training(label);
    }
  }

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenetModule.current.infer(
        video.current,
        true
      );
      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    })
  }

  const run = async () => {
    const embedding = mobilenetModule.current.infer(
      video.current,
      true
    );
    const result = await classifier.current.predictClass(embedding);
    
    if (result.label === CHEATING &&
      result.confidences[result.label] > CONFIDENCE
    ) {
      console.log("Cheating");

      setCheated(true);
    }else {
      console.log("Not Cheating");
      setCheated(false);
    }

    await sleep(200);
    run();
  }
  const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  
  useEffect(() => {

    init();

    //cleanup
    return () => {

    }

  }, []);

  return (
    <div className={`main ${cheated ? 'cheated' : ''}`}>
      <video
        ref={video}
        className="video"
        autoPlay
      />

      <div className="control">
        <button className="btn" onClick={() => train(NOT_CHEATING)}>Train 1</button>
        <button className="btn" onClick={() => train(CHEATING)}>Train 2</button>
        <button className="btn" onClick={() => run()}>Run</button>
      </div>
    </div>
  );
}

export default App;
