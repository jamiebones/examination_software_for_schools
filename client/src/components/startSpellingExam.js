import React, { useEffect, useState } from "react";
import styled from "styled-components";
import CountDownTimer from "./countDownTimer";
//import NewWindow from "react-new-window";
import state from "../applicationState";
import { useRecoilValue } from "recoil";
import { useMutation } from "@apollo/client";
import { SpellingExaminationEnded } from "../graphql/mutation";
import store from "store";
import methods from "../methods";
import Modal from "react-modal";
import { useRouteMatch } from "react-router-dom";
import settings from "../config";

const baseUrl = settings.API_URL;
Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

const QuestionPanelStyles = styled.div`
  .card-layout {
    background: #8e8383;
    padding: 20px;
  }

  .btn-wl {
    cursor: pointer;
  }

  .input-row {
    margin: 10px 0px;
    display: flex;
    flex-wrap: wrap;
  }
  .input-spelling {
    margin: 10px;
    text-align: center;
    font-size: 40px;
    width: 80px;
    height: 80px;
  }
  .number {
    font-size: 24px;
    align-self: center;
    padding: 0 40px;
  }
  .guide-div {
    margin: 20px 0 0 0px;
  }
  .spelling-div {
    display: flex;
    flex-direction: column;
  }
  .clue {
    margin: 10px 105px;
    font-size: 20px;
  }
  .exam-label {
    font-size: 22px;
  }
  .exam-span {
    margin: 20px;
    font-weight: bold;
    font-size: 14px;
  }
  .exam-div {
    background-image: url("/assets/spelling_bee.png");
    background-repeat: no-repeat;
    background-position-x: right;
  }
  @media only screen and (max-width: 600px) {
    .exam-div {
      background-size: 90px;
    }
    .clue {
    }
    .input-row {
    }
  }
`;

const disableContext = (e) => {
  e.preventDefault();
};

const disableButtons = (e) => {
  const code = e.which || e.keyCode;
  switch (code) {
    case 116:
      return e.preventDefault();
    default:
      return true;
  }
};

const buildUpQuestions = (questionsArray = []) => {
  let buildArray = [];
  questionsArray.map(({ word, correctWord, clue }, index) => {
    let questionObject = {
      word,
      number: index,
      clue,
      correctWord,
    };
    let wordArray = [];
    //split word here and turn into an array
    for (let i = 0; i < word.length; i++) {
      const currentLetter = word[i];
      const inputObject = {};
      if (currentLetter === "*") {
        inputObject.readOnly = false;
        inputObject.value = "*";
      } else {
        inputObject.readOnly = true;
        inputObject.value = currentLetter;
      }
      wordArray.push(inputObject);
    }
    questionObject.wordArray = wordArray;
    buildArray.push(questionObject);
  });
  return buildArray;
};

const QuestionPanelSpelling = (props) => {
  const match = useRouteMatch("/exam/spelling/:examId");
  const [examinationEndedFunction, examinationEndedResult] = useMutation(
    SpellingExaminationEnded
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [examIdValue, setExamIdValue] = useState(null);
  const examStarted = useRecoilValue(state.examStartedState);
  const questionsFromStore = store.get("examQuestions");
  const examIdinStore = store.get("examId");
  const examStartedinStore = store.get("examStarted");
  const [questions, setQuestionsData] = useState([]);
  const [scoreDetails, setScoreDetails] = useState(null);
  const currentUser = useRecoilValue(state.currentLoginUserState);
  const [user, setUser] = useState(null);
  const storedData = store.get("questionData");
  const { examName, examType, examDuration } = store.get("examDetails");
  let examId = match.params.examId;

  //effect to build up the questions
  useEffect(() => {
    const questionData = buildUpQuestions(questionsFromStore);
    setUser(currentUser);
    setQuestionsData(questionData);
    const storedData = store.get("questionData");
    if (!storedData) {
      store.set("questionData", questionData);
    }
  }, []);

  useEffect(() => {
    if (!examId) {
      props.history.push("/exam_start_page");
    }
    setExamIdValue(examId);
  }, [examId]);

  useEffect(() => {
    window.addEventListener("contextmenu", disableContext);
    window.addEventListener("keydown", disableButtons);
    return () => {
      window.removeEventListener("contextmenu", disableContext);
      window.removeEventListener("keydown", disableButtons);
    };
  });

  useEffect(() => {
    const { loading, data, error } = examinationEndedResult;
    if (loading) {
      //show a modal asking them to wait that submission is on going.
    }
    if (data) {
      //redirect here to the summary page
      setSubmitting(!submitting);
      //clear the store value
      methods.Utils.ClearStoreValue();
      props.history.replace(`/exam_summary/spelling/${examIdValue}`, {
        scoreDetails: scoreDetails,
      });
    }

    if (error) {
      setErrors(error.message);
      setSubmitting(!submitting);
    }
  }, [
    examinationEndedResult.loading,
    examinationEndedResult.data,
    examinationEndedResult.error,
  ]);

  const submitQuizHandler = async () => {
    //get the quiz answers and the other variables in the system
    let examStartedVariable, examIdVariable;
    examStartedVariable = examStarted ? examStarted : examStartedinStore;
    examIdVariable = examId ? examId : examIdinStore;
    if (examStartedVariable && examIdVariable) {
      //we are good we can gather things here
      const { total, scripts } = methods.MarkSpellingExam(storedData);
      setScoreDetails({
        score: total,
        totalQuestions: scripts.length,
        examId: examIdVariable,
        user: user,
      });
      const submissionObject = {
        examTakenId: examIdVariable,
        examFinished: true,
        timeExamEnded: new Date(),
        score: total,
        scripts,
      };
      try {
        setSubmitting(!submitting);
        await examinationEndedFunction({
          variables: {
            submissionDetails: submissionObject,
          },
        });
      } catch (error) {}
    }
  };

  const handleTextInputChange = ({ e, arrayPosition, wordPosition }) => {
    const value = e.target.value;
    if (value.length <= 1) {
      const cloneData = [...storedData];
      const currentInput = cloneData[arrayPosition].wordArray[wordPosition];
      currentInput.value = value.toUpperCase();
      cloneData[arrayPosition].wordArray[wordPosition] = currentInput;
      //save the data back into the purse
      store.set("questionData", cloneData);
      setQuestionsData(cloneData);
    }
  };

  return (
    <React.Fragment>
      <QuestionPanelStyles>
        <div className="row">
          <div className="col-md-10 offset-md-1">
            <p className="exam-label">
              Examination Name:
              <span className="exam-span">
                {examName && examName.toUpperCase()}
              </span>
            </p>

            <p className="exam-label">
              Examination Type:
              <span className="exam-span">
                {examType && examType.toUpperCase()}
              </span>
            </p>

            <p className="exam-label">
              Exam Duration:
              <span className="exam-span">
                {methods.Utils.ConvertMinutesToHours(examDuration)}
              </span>
            </p>

            <div className="text-center">
              <CountDownTimer submitQuiz={submitQuizHandler} />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-1"></div>
          <div className="col-xs-10 col-sm-10 col-md-10 card">
            <div className="exam-div">
              {errors && <p className="lead text-danger">{errors}</p>}
              {storedData &&
                storedData.map(({ number, clue, wordArray }, ind) => {
                  return (
                    <div className="spelling-div">
                      <div className="input-row" key={ind}>
                        <p className="number">{number + 1}. </p>
                        {wordArray &&
                          wordArray.map(({ readOnly, value }, index) => {
                            return (
                              <input
                                key={value + readOnly + index}
                                disabled={readOnly}
                                type="text"
                                value={value === "*" ? "" : value}
                                placeholder={value === "*" ? "-" : ""}
                                className="form-control input-spelling"
                                onChange={(e) =>
                                  handleTextInputChange({
                                    e,
                                    arrayPosition: ind,
                                    wordPosition: index,
                                  })
                                }
                              />
                            );
                          })}
                      </div>
                      <p className="clue">clue : {clue}</p>
                      <hr />
                    </div>
                  );
                })}
              <div className="text-center">
                <button
                  className="btn btn-success"
                  disabled={submitting}
                  onClick={submitQuizHandler}
                >
                  {submitting
                    ? "submitting please wait"
                    : "Submit Spelling Examination"}
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-1"></div>
        </div>
      </QuestionPanelStyles>

      <Modal
        isOpen={submitting}
        style={customStyles}
        contentLabel="Examination submission modal"
      >
        <p>Submitting examination please wait........</p>
      </Modal>
    </React.Fragment>
  );
};

export default QuestionPanelSpelling;
