import React, { Component } from 'react';
import './App.css';
import statements from './statements'

const unique = array => array.filter((item, i) => array.indexOf(item) === i);
const levels = unique(statements.map(({ level }) => level));

const avg = arr => arr.reduce((sum, v) => sum + v, 0) / arr.length;

const calculateResultLevel = confidenceMap => {
  const sortedConfidenceMaps = Object.keys(confidenceMap)
    .sort()
    .reverse();
  const finalLevel = sortedConfidenceMaps.find(level => {
    const lvlConfMap = confidenceMap[level];
    const percToLevel = percentage => (percentage / 100) * 4;
    return (
      avg(lvlConfMap) >= 3 ||
      (avg(lvlConfMap) > percToLevel(60) && lvlConfMap.length >= 2)
    );
  });
  return finalLevel || 0;
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      initialQuestion: true,
      questionsAsked: [],
      previousLevels: [],
      currentLevel: null,
      confidenceMap: {},
      isEnd: false
    };
    this.getInitialQuestionChoices = this.getInitialQuestionChoices.bind(this);
    this.getChoices = this.getChoices.bind(this);
    this.handleInitialClick = this.handleInitialClick.bind(this);
    this.handleNextLevel = this.handleNextLevel.bind(this);
    this.getSliderChoices = this.getSliderChoices.bind(this);
  }

  defaultGetCanDo(level) {
    if (this.state.isEnd) return;
    const statementsByLevel = statements.reduce(
      (obj, statement) => ({
        ...obj,
        [statement.level]: [...(obj[statement.level] || []), statement.question]
      }),
      {}
    );
    const previouslyAskedQuestionsForLevel = this.state.questionsAsked
      .filter(q => q.level === level)
      .map(({ question }) => question);
    const questionsForLevel = statementsByLevel[levels[level]];
    const askableQuestions =
      previouslyAskedQuestionsForLevel.length < questionsForLevel.length
        ? questionsForLevel.filter(
            q => !previouslyAskedQuestionsForLevel.includes(q)
          )
        : questionsForLevel;
    const getRandFromArray = array =>
        array[Math.floor(Math.random() * array.length)];
    return getRandFromArray(askableQuestions);
  }

  handleNextLevel(event) {
    if (this.state.isEnd) return;
    const { id } = event.target;
    const idInt = parseInt(id);
    const { currentLevel } = this.state;
    let resultLevel = currentLevel;
    const isSecondNeedPracticeInARow = () => {
      if (idInt !== 2 || this.state.questionsAsked.length === 0) {
        return false;
      }
      const { answer, level } = this.state.questionsAsked[
        this.state.questionsAsked.length - 1
      ];
      return answer === 2 && currentLevel === level;
    };
    const answerTexts = this.state.questionsAsked.map(questionAsked => questionAsked.answerText);
    // fix this...
    if (answerTexts.length >= 3 && answerTexts.slice(1).slice(-3).every(val => val === "Don't know" )) {
      this.setState({ isEnd: true })
    } else {
      if (this.state.questionsAsked.length >= 5) {
        resultLevel = calculateResultLevel({
          ...this.state.confidenceMap,
          [currentLevel]: [...(this.state.confidenceMap[currentLevel] || []), idInt]
        })
        this.setState({ isEnd: true })
      }
      if (idInt > 2) {
        resultLevel = Math.min(levels.length - 1, currentLevel + 1);
      }
      if (idInt < 2 || isSecondNeedPracticeInARow()) {
        resultLevel = Math.max(0, currentLevel - 1);
      }
    }

    this.setState({
      questionsAsked: [
        ...this.state.questionsAsked,
        {
          question: this.defaultGetCanDo(this.state.currentLevel),
          answer: idInt,
          answerText: this.getSliderChoices()[idInt],
          level: currentLevel,
        },
      ],
      currentLevel: resultLevel,
      confidenceMap: {
        ...this.state.confidenceMap,
        [currentLevel]: [
          ...(this.state.confidenceMap[currentLevel] || []),
          idInt
        ]
      }
    });
  }

  handleInitialClick(event) {
    const { id } = event.target;
    const idInt = parseInt(id);
    const cutPoint = Math.ceil(levels.length / 2);
    const splitLevels = [levels.slice(0, cutPoint), levels.slice(cutPoint)];
    const selectedSplitLevels = splitLevels[idInt];
    const currentLevel = levels.indexOf(
      selectedSplitLevels[Math.floor(selectedSplitLevels.length / 2)]
    );
    this.setState({
      questionsAsked: [
        ...this.state.questionsAsked,
        {
          question: "How much previous knowledge do you have of Spanish?",
          answer: idInt,
          answerText: ["a little", "a lot"][idInt]
        },
      ],
      currentLevel,
      initialQuestion: false,
    });
  }

  getInitialQuestionChoices() {
    const initialChoiceTexts = ["a little", "a lot"]
    return <div>{initialChoiceTexts.map((text, i) => <button id={i} onClick={this.handleInitialClick}>{text}</button>)}</div>;
  }

  getSliderChoices() {
    return [
      "Don't know",
      "I want to review this",
      "Need practice",
      "Confident",
      "Super confident"
    ];
  }

  getChoices() {
    return <div>{this.getSliderChoices().map((text, i) => <button id={i} onClick={this.handleNextLevel}>{text}</button>)}</div>;
  }

  render() {
    return (
      <div>
        <h3>Step by Step placement</h3>
        <p>{this.state.initialQuestion ? "How much previous knowledge do you have of Spanish?" : this.defaultGetCanDo(this.state.currentLevel)}</p>
        {this.state.initialQuestion ? this.getInitialQuestionChoices() : this.getChoices()}
        <br />
        <h3>Current level: {levels[this.state.currentLevel]}</h3>
        <p></p>
        <p>{this.state.isEnd && "That's the end!"}</p>
      </div>
    );
  }
}

export default App;
