import React, { useEffect } from "react";
import styled from "styled-components";
import { useRouteMatch, useLocation } from "react-router-dom";

import store from "store";

const ExamSummaryStyles = styled.div`
  .summaryDiv {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 600px;
  }
  .summaryBoard {
    background-color: #0f292d;
    width: 100%;
    margin: 20%;
    padding: 20px;
    color: white;

    p {
      font-size: 20px;
      padding: 20px;
    }

    span {
      float: right;
    }
  }
  .user {
    background: #1a3a28;
    padding: 20px;
  }
  .score {
    background: #205d4c;
    padding: 20px;
  }

  .total {
    background: #11233e;
    padding: 20px;
  }

  .percentage {
    background: #080802;
    padding: 20px;
  }
  .grade {
    background: #44194c;
    padding: 20px;
  }
`;



const ExamSummaryComponent = (props) => {
  const location = useLocation();
  console.log("location data", location);
  const scoreDetails = location.state && location.state.scoreDetails;
  const { score, totalQuestions, examId, user } = scoreDetails || {};
  const match = useRouteMatch("/exam_summary/essay/:examId");
  const total = totalQuestions;
  const percentageScore = ((score / total) * 100).toFixed(2);
  const grade = percentageScore >= 50 ? "Pass" : "Fail";

  //clear the store and variables here

  const navigateToScriptPage = () => {
    props.history.push(`/essay_examination_script/${match.params.examId}`);
  };

  useEffect(() => {
    //persists it to store here
    store.remove("examStarted");
    store.remove("examQuestions");
    store.remove("currentIndex");
    store.remove("duration");
    store.remove("examId");
    store.remove("totalQuestions");
    store.remove("timer");
  }, []);

 
  return (
    <ExamSummaryStyles>
      <div className="row">
        <div className="col-md-12">
          <div className="summaryDiv">
            <div className="summaryBoard">
              <p className="text-center lead">Result Summary</p>
              <p className="user">
                Name : <span>{user && user.name && user.name.toUpperCase()}</span>
              </p>

              <p className="score">
                Score: <span>{score}</span>
              </p>

              <p className="total">
                Total : <span>{total}</span>
              </p>

              <p className="percentage">
                Percentage : <span>{percentageScore}%</span>
              </p>

              <p className="grade">
                Grade : <span>{grade}</span>
              </p>
            </div>
          </div>
          <div className="text-center">
            <button
              className="btn btn-danger btn-lg"
              onClick={navigateToScriptPage}
            >
              view scripts
            </button>
          </div>
        </div>
      </div>
    </ExamSummaryStyles>
  );
};

export default ExamSummaryComponent;
