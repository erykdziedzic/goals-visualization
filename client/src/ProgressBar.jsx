import React from 'react';
import PropTypes from 'prop-types';
import './Home.css';

const getStatus = (value, goal) => {
  if (value / goal >= 1) return 'achieved';
  if (value / goal > 0.5) return 'almost';
  return 'failed';
};

class ProgressBar extends React.PureComponent {
  render() {
    const { title, value, goal } = this.props;

    const currentMonth = new Date().getMonth() + 1;
    const currentGoal = goal ? goal * (currentMonth / 12) : undefined;
    let percentage;
    if (value && currentGoal) {
      percentage = `${Math.round(((value * 100) / currentGoal) * 100) / 100}%`;
    }
    const status = getStatus(value, currentGoal);
    return (
      <div className="progressBar">
        <div style={{ width: percentage || '0%' }} className={`progressBarValue ${status}`} />
        <div className="progressBarValueText">
          {`${title} | ${value !== undefined ? value : '?'} - ${percentage || '?'} z ${currentGoal || '?'}`}
        </div>
      </div>
    );
  }
}

ProgressBar.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number,
  goal: PropTypes.number,
};

ProgressBar.defaultProps = {
  value: undefined,
  goal: undefined,
};

export default ProgressBar;
