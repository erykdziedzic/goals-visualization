import React from 'react';
import './Home.css';
import logo from './logo.png';
import ProgressBar from './ProgressBar';

const getToken = (login, key) => fetch('/api/auth',
  { method: 'post', headers: { 'Content-type': 'application/json' }, body: JSON.stringify({ login, key }) }).then((res) => {
  if (res.status === 200) return res.json();
  return undefined;
});

const getSheet = (range, token) => fetch('/api/data',
  { method: 'post', headers: { 'Content-type': 'application/json' }, body: JSON.stringify({ range, token }) })
  .then((res) => res.json())
  .catch((e) => console.log(e));


const getStatus = (current, goal, secondCol = false) => {
  if (current / goal >= 1) return 'achieved';
  if (current / goal > 0.5 && !secondCol) return 'almost';
  return 'failed';
};

const getPercentage = (current, goal) => (current && goal ? `${Math.round(((current * 100) / goal) * 100) / 100}%` : undefined);

const getCell = (table, y, x) => {
  if (table && table[y][x]) return Number(table[y][x].replace('%', '').replace(',', '.'));
  return undefined;
};

export default class Home extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      income: undefined,
      marketingSales: undefined,
      customers: undefined,
      organizationalCapacity: undefined,
    };
  }

  async componentDidMount() {
    const login = prompt('Enter login: '); // eslint-disable-line no-alert
    const key = prompt('Enter password: '); // eslint-disable-line no-alert
    const token = await getToken(login, key);

    if (token) {
      const income = await getSheet('Cele 2020!A1:Q5', token);
      const marketingSales = await getSheet('Cele 2020!A8:Q19', token);
      const customers = await getSheet('Cele 2020!A22:D30', token);
      const organizationalCapacity = await getSheet('Cele 2020!A33:D38', token);
      this.setState({
        income, marketingSales, customers, organizationalCapacity,
      });
    } else {
      alert('Unauthorized!'); // eslint-disable-line no-alert
      location.reload(); // eslint-disable-line no-restricted-globals
    }
  }

  render() {
    const {
      income,
      marketingSales,
      customers,
      organizationalCapacity,
    } = this.state;

    const currentMonth = new Date().getMonth();
    const getRowSum = (row, startCol) => {
      if (marketingSales) {
        const rowElements = Array.from(marketingSales[row]);
        rowElements.splice(0, startCol - 1);
        let sum = 0;
        rowElements.forEach((val) => { sum += Number(val.replace(',', '.')); });
        return sum;
      }
      return undefined;
    };

    return (
      <div className="Home">
        <div className="Content">
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
          >
            <div className="logoContainer">
              <img src={logo} alt="Logo" />
            </div>
            <div className="progressBar YearlyIncome">
              <div style={{ width: getPercentage(getCell(income, 1, 3), getCell(income, 1, 1)) || '0%' }} className={`progressBarValue ${getStatus(getCell(income, 1, 3), getCell(income, 1, 1))}`} />
              <div className="progressBarValueText yearlyIncomeValueText">
                {`Yearly income | ${getCell(income, 1, 3) || '?'} - ${getPercentage(getCell(income, 1, 3), getCell(income, 1, 1)) || '?'} z ${getCell(income, 1, 1) || '?'}`}
              </div>
            </div>
            <div className="progressBar YearlyIncome MonthlyIncome">
              <div style={{ width: getPercentage(getCell(income, 1, 5 + currentMonth), getCell(income, 1, 4)) || '0%' }} className={`progressBarValue ${getStatus(getCell(income, 1, 5 + currentMonth), getCell(income, 1, 4))}`} />
              <div className="progressBarValueText yearlyIncomeValueText">
                {`Monthly income (${income ? income[0][5 + currentMonth] : '?'}) | ${getCell(income, 1, 5 + currentMonth) || '?'} - ${getPercentage(getCell(income, 1, 5 + currentMonth), getCell(income, 1, 4)) || '?'} z ${getCell(income, 1, 4) || '?'}`}
              </div>
            </div>
          </div>
          <div className="DataColumns">
            <div className="dataColumn">
              <div className={`status ${getStatus(getCell(marketingSales, 3, 5 + currentMonth), getCell(marketingSales, 3, 4))}`}>Sprints</div>
              <div className={`status ${getStatus(getCell(income, 2, 3), getCell(income, 2, 1))}`}>Costs</div>
              <div className={`status ${getStatus(getCell(income, 3, 3), getCell(income, 3, 1))}`}>Space-income</div>
              <div className={`status ${getStatus(getCell(income, 4, 3), getCell(income, 4, 1))}`}>VP-income</div>
            </div>
            <div className="dataColumn">
              <div className={`status ${getStatus(getCell(customers, 0, 3), getCell(customers, 0, 1), true)}`}>LTV (Life Time Value)</div>
              <div className={`status ${getStatus(getCell(customers, 1, 3), getCell(customers, 1, 1), true)}`}>Recommendations</div>
              <div className={`status ${getStatus(getCell(customers, 2, 3), getCell(customers, 2, 1), true)}`}>Testimonials</div>
              <div className={`status ${getStatus(getCell(customers, 3, 3), getCell(customers, 3, 1), true)}`}>Come backs</div>
              <div className={`status ${getStatus(getCell(customers, 4, 3), getCell(customers, 4, 1), true)}`}>Case studies</div>
              <div className={`status ${getStatus(getCell(customers, 7, 3), getCell(customers, 7, 1), true)}`}>#Sztosowość</div>
            </div>
            <div className="dataColumn">
              <div className={`status ${getStatus(getCell(marketingSales, 0, 3), getCell(marketingSales, 0, 1))}`}>Leads</div>
              <div className={`status ${getStatus(getCell(marketingSales, 1, 3), getCell(marketingSales, 1, 1))}`}>Sales efficiency</div>
              <div className={`status ${getStatus(getCell(marketingSales, 2, 3), getCell(marketingSales, 2, 1))}`}>Outbound leads</div>
              <div className={`status ${getStatus(getCell(marketingSales, 3, 3), getCell(marketingSales, 3, 1))}`}>Sold sprints</div>
              <div className={`status ${getStatus(getRowSum(4, 6), getCell(marketingSales, 4, 1))}`}>Case studies</div>
              <ProgressBar title="Blog posts" value={getRowSum(5, 6)} goal={getCell(marketingSales, 5, 1)} />
            </div>
            <div className="dataColumn">
              <ProgressBar title="Dribble" value={getRowSum(6, 6)} goal={getCell(marketingSales, 6, 1)} />
              <ProgressBar title="Conferences" value={getRowSum(7, 6)} goal={getCell(marketingSales, 7, 1)} />
              <ProgressBar title="External media" value={getRowSum(8, 6)} goal={getCell(marketingSales, 8, 1)} />
              <ProgressBar title="Personal branding" value={getRowSum(9, 6)} goal={getCell(marketingSales, 9, 1)} />
              <ProgressBar title="Events by PP" value={getRowSum(10, 6)} goal={getCell(marketingSales, 10, 1)} />
              <ProgressBar title="FB / Linkedin" value={getRowSum(11, 6)} goal={getCell(marketingSales, 11, 1)} />
            </div>
            <div className="dataColumn">
              <ProgressBar title="New Team members" value={getCell(organizationalCapacity, 0, 3) - 11} goal={getCell(organizationalCapacity, 0, 1) - getCell(organizationalCapacity, 0, 3)} />
              <ProgressBar title="Training" value={getCell(organizationalCapacity, 1, 3)} goal={getCell(organizationalCapacity, 1, 1)} />
              <ProgressBar title="UX training" value={getCell(organizationalCapacity, 2, 3)} goal={getCell(organizationalCapacity, 2, 1)} />
              <ProgressBar title="Strategy training" value={getCell(organizationalCapacity, 3, 3)} goal={getCell(organizationalCapacity, 3, 1)} />
              <ProgressBar title="Breakfasts with Beata" value={getCell(organizationalCapacity, 4, 3)} goal={getCell(organizationalCapacity, 4, 1)} />
              <ProgressBar title="Team knowledge sharing" value={getCell(organizationalCapacity, 5, 3)} goal={getCell(organizationalCapacity, 5, 1)} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
