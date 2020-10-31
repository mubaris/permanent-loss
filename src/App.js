import React, { Component } from 'react';
import {
  Box,
  Button,
  Heading,
  Grommet,
  ResponsiveContext,
  FormField,
  Select,
  Paragraph
} from 'grommet';
// import { FormClose, Notification } from 'grommet-icons';
import { NumberInput, DateInput } from 'grommet-controls';
import { PieChart } from 'grommet-controls/chartjs';
import { List } from 'immutable';
import dayjs from 'dayjs';

const theme = {
  global: {
    colors: {
      brand: '#2c2f36',
    },
    font: {
      family: 'Roboto',
      size: '14px',
      height: '20px',
    },
  },
  button: {
    padding: {
      horizontal: '30px'
    }
  }
};

const assetList = [
  {
    id: 'ethereum',
    display: 'ETH',
    limit: '01-01-2017',
    color: '#4e8ee9'
  },
  {
    id: 'bitcoin',
    display: 'BTC',
    limit: '01-01-2017',
    color: '#f59621'
  },
  {
    id: 'usd',
    display: 'USD Stablecoins',
    limit: '01-01-2017',
    color: '#e5e8c9'
  },
  {
    id: 'chainlink',
    display: 'LINK',
    limit: '12-01-2017',
    color: '#2a5ada'
  },
  {
    id: 'havven',
    display: 'SNX',
    limit: '03-30-2018',
    color: '#00d1ff'
  },
  {
    id: 'uma',
    display: 'UMA',
    limit: '05-01-2020',
    color: '#ff4a4a'
  },
  {
    id: 'compound-governance-token',
    display: 'COMP',
    limit: '06-18-2020',
    color: '#00d395'
  },
  {
    id: 'uniswap',
    display: 'UNI',
    limit: '09-18-2020',
    color: '#ff006f'
  },
  {
    id: 'maker',
    display: 'MKR',
    limit: '12-21-2017',
    color: '#53aea0'
  },
  {
    id: 'yearn-finance',
    display: 'YFI',
    limit: '07-20-2020',
    color: '#006ae2'
  },
  {
    id: 'republic-protocol',
    display: 'REN',
    limit: '03-05-2018',
    color: '#080817'
  },
  {
    id: '0x',
    display: 'ZRX',
    limit: '10-26-2017',
    color: '#1d2227'
  },
  {
    id: 'kyber-network',
    display: 'KNC',
    limit: '11-07-2017',
    color: '#31cb9e'
  },
  {
    id: 'nxm',
    display: 'NXM',
    limit: '07-11-2020',
    color: '#20252e'
  },
  {
    id: 'numeraire',
    display: 'NMR',
    limit: '07-15-2017',
    color: '#221e1f'
  }
];

const symbols = {
  'ethereum': 'ETH',
  'bitcoin': 'BTC',
  'usd': 'USD',
  'chainlink': 'LINK',
  'havven': 'SNX',
  'uma': 'UMA',
  'compound-governance-token': 'COMP',
  'uniswap': 'UNI',
  'maker': 'MKR',
  'yearn-finance': 'YFI',
  'republic-protocol': 'REN',
  '0x': 'ZRX',
  'kyber-network': 'KNC',
  'nxm': 'NXM',
  'numeraire': 'NMR',
}

const AppBar = (props) => (
  <Box
    tag='header'
    direction='row'
    align='center'
    justify='between'
    background='brand'
    pad={{ left: 'medium', right: 'small', vertical: 'small' }}
    elevation='medium'
    style={{ zIndex: '1' }}
    {...props}
  />
);

class App extends Component {
  state = {
    impermanentLoss: 0,
    returns: 0,
    returnSubIl: 0,
    nAssets: 2,
    assetWeights: List([50.00, 50.00]),
    assetDeltas: List([0.00, 0.00]),
    toDate: dayjs().format('MM-DD-YYYY'),
    fromDate: dayjs().subtract(3, 'month').format('MM-DD-YYYY'),
    dateBounds: ['01-01-2017', dayjs().format('MM-DD-YYYY')],
    assetList: assetList,
    displayList: assetList.map(a => a.display),
    selectedAssets: ['ethereum', 'bitcoin'],
    showIl: false,
    cache: {}
  }

  changeWeight(i, e) {
    let v = parseFloat(e.target.value);
    if (isNaN(v)) {
      v = 1;
    }
    let weights = this.state.assetWeights;
    const d = v - weights.get(i);
    // console.log(weights, v, i, d);
    if (i === weights.size - 1) {
      weights = weights.set(i, v);
      weights = weights.update(0, x => (x - d));
    } else {
      weights = weights.set(i, v);
      weights = weights.update(-1, x => (x - d));
    }
    this.setState({ assetWeights: weights }, () => {
      this.fetchAndCalculate()
    });
  }

  changeDate(direction, e) {
    if (direction === 'from') {
      this.setState({ fromDate: e.target.value }, () => {
        this.fetchAndCalculate()
      });
    } else if (direction === 'to') {
      this.setState({ toDate: e.target.value }, () => {
        this.fetchAndCalculate()
      });
    } else {
      return null;
    }
  }

  changeAsset(i, e) {
    const v = e.value;
    const display = this.state.displayList;
    display[i] = v;
    const index = this.state.assetList.map(e => e.display).indexOf(v);
    const selectedAssets = this.state.selectedAssets;
    selectedAssets[i] = this.state.assetList[index].id;
    const startDate = this.state.assetList[index].limit;
    const dateBounds = [startDate, dayjs().format('MM-DD-YYYY')];
    let fromDate = this.state.fromDate;
    if (dayjs(fromDate, 'MM-DD-YYYY').isBefore(dayjs(startDate, 'MM-DD-YYYY'))) {
      fromDate = startDate;
    }
    this.setState({ displayList: display, dateBounds, fromDate }, () => {
      this.fetchAndCalculate()
    });
  }

  addAsset(e) {
    let deltas = this.state.assetDeltas;
    let weights = this.state.assetWeights;
    const assets = this.state.selectedAssets;

    deltas = deltas.insert(deltas.size, 0);
    weights = weights.push(weights.get(-1));

    const newN = deltas.size;

    weights = this.normalizeWeights(weights);

    assets.push(this.state.assetList[assets.length].id);

    const index = this.state.assetList.map(e => e.id).indexOf(assets[newN - 1]);
    const startDate = this.state.assetList[index].limit;
    const dateBounds = [startDate, dayjs().format('MM-DD-YYYY')];
    let fromDate = this.state.fromDate;
    if (dayjs(fromDate, 'MM-DD-YYYY').isBefore(dayjs(startDate, 'MM-DD-YYYY'))) {
      fromDate = startDate;
    }

    this.setState({ assetWeights: weights, assetDeltas: deltas, nAssets: newN, selectedAssets: assets, dateBounds, fromDate }, () => {
      this.fetchAndCalculate()
    });
  }

  normalizeWeights(weights) {
    // console.log(weights, "input")
    const sum = weights.reduce((a,b) => a + b, 0);
    if (sum !== 100) {
      for (let i = 0; i < weights.size; i++) { weights = weights.update(i, w => w * 100 / sum) }
      // console.log(weights, "output", sum);
      return weights
    }
    return weights;
  }

  getWeight(i) {
    if (List.isList(this.state.assetWeights)) {
      return this.state.assetWeights.get(i);
    }
    return (100 / this.state.nAssets);
  }

  async fetchAndCalculate() {
    const selectedAssets = this.state.selectedAssets;
    const weights = this.state.assetWeights;
    let url = '';
    const from = dayjs(this.state.fromDate, 'MM-DD-YYYY').unix();
    const to = dayjs(this.state.toDate, 'MM-DD-YYYY').unix();
    // console.log(from, to);
    const diffs = Array(selectedAssets.length).fill(1);
    let diff = 0;
    let prices = null;
    let i = 0;
    let response = null;
    let jsonData = null;
    const cache = this.state.cache;
    const cacheKey = `${from}_${to}`;
    for (const asset of selectedAssets) {
      if (asset !== 'usd') {
        if(cache[asset] && cache[asset][cacheKey]) {
          jsonData = cache[asset][cacheKey];
        } else {
          url = `https://api.coingecko.com/api/v3/coins/${asset}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          response = await fetch(url);
          jsonData = await response.json();
          cache[asset] = { [cacheKey]: jsonData }
        }
        prices = jsonData.prices;
        diff = prices[prices.length - 1][1] / prices[0][1];
        diffs[i] = diff;
      } else {
        diffs[i] = 1;
      }
      i++;
    }

    let num = 1;
    let den = 0;

    let returns = 0;

    for (let i = 0; i < this.state.nAssets; i++) {
      num *= Math.pow(diffs[i], weights.get(i) / 100);
      den += diffs[i] * weights.get(i) / 100;
      returns += weights.get(i) * diffs[i] / 100;
    }

    returns = ((returns - 1) * 100).toFixed(3);
    const impermanentLoss = ((1 - (num / den) || 0) * 100).toFixed(3);
    const returnSubIl = (returns - impermanentLoss).toFixed(3);

    this.setState({ impermanentLoss, showIl: true, cache, returns, returnSubIl });
  }

  getOptions() {
    const selectedAssets = this.state.selectedAssets;
    const labels = [];
    const colors = [];
    let index = null;
    for (const asset of selectedAssets) {
      labels.push(symbols[asset]);
      index = this.state.assetList.map(e => e.id).indexOf(asset);
      colors.push(this.state.assetList[index].color);
    }
    // console.log(colors);
    const weights = this.state.assetWeights;
    const output = {
      'labels': labels,
      'datasets': [{ 'data': weights.toJS(), 'backgroundColor': colors, 'borderColor': colors }]
    }
    return output;
  }

  render() {
    // const { impermanentLoss } = this.state;
    // const now = dayjs();
    // const threeMonths = dayjs().subtract(3, 'month');
    const options = this.state.assetList.map(a => a.display);
    return (
      <Grommet theme={theme} themeMode="dark" full>
        <ResponsiveContext.Consumer>
          {size => (
            <Box margin={{bottom: 'medium'}}>
              <AppBar>
                <Heading level='3' margin='none'>Permanent Loss™</Heading>
                {/* <Button
                  icon={<Notification />}
                  onClick={() => this.setState({ showSidebar: !this.state.showSidebar })}
                /> */}
              </AppBar>
              <Box direction='row'>
                <Box flex align='center' justify='center'>
                <Box direction='row'>
                    <FormField label="From" margin='xsmall'>
                      <DateInput
                        value={this.state.fromDate}
                        onChange={(e) => this.changeDate('from', e)}
                        bounds={this.state.dateBounds}
                      />
                    </FormField>
                    <FormField label="To" margin='xsmall'>
                      <DateInput
                        value={this.state.toDate}
                        onChange={(e) => this.changeDate('to', e)}
                        bounds={this.state.dateBounds}
                      />
                    </FormField>
                  </Box>
                  {Array(this.state.nAssets).fill(0).map((v, i) => {
                    return (<Box pad='small' key={i} direction='row'>
                      <FormField label="Asset" margin='xsmall'>
                        <Select
                          options={options}
                          value={this.state.displayList[i]}
                          onChange={(e) => this.changeAsset(i, e)}
                        />
                      </FormField>
                      <FormField label="Weight" margin='xsmall'>
                        <NumberInput
                          value={this.getWeight(i)}
                          min={1.00}
                          max={99.00}
                          onChange={(e) => this.changeWeight(i, e)}
                          decimals={3}
                          step={0.1}
                          updateToString={true}
                          integers={2}
                          suffix={' %'}
                        />
                      </FormField>
                    </Box>)
                  })}
                  <Box direction='row' pad='small'>
                    <Button primary label="Add Asset" onClick={this.addAsset.bind(this)} margin='xsmall' />
                    <Button primary label="Calculate IL" onClick={this.fetchAndCalculate.bind(this)} margin='xsmall' />
                  </Box>
                  {this.state.showIl && 
                    <Box pad='small' align='center'>
                      <Paragraph size='large' style={{whiteSpace: 'pre', fontWeight: 600, lineHeight: 1.6}} textAlign='center'>
                        Historic (Im)Permanent Loss: {this.state.impermanentLoss}%{`\n`}
                        HODL Returns: {this.state.returns}%{`\n`}
                        HODL - IL: {this.state.returnSubIl}%
                      </Paragraph>
                      <Box>
                        <PieChart
                          data={this.getOptions()}
                          options={{ legend: { display: true }, themedData: false }}
                        />
                      </Box>
                    </Box>
                  }
                </Box>
              </Box>
            </Box>
          )}
        </ResponsiveContext.Consumer>
      </Grommet>
    );
  }
}

export default App;