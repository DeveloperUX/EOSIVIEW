import React, { useState } from 'react';
import { JsonRpc } from 'eosjs';
import style from './app.module.css';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import ProgressButton from 'react-progress-button'

const getActionsCount = (block) => {
  let actionsCount = 0;
  // make sure we default this to an empty array in case it's undefined
  const { transactions = [] } = block;
  for (let transaction of transactions) {
    const { trx = {} } = transaction;
    // note: some trx are string IDs while some are full objects
    if (typeof trx === 'object') {
      // note: Assuming we need to count both actions and context_free_actions
      // which are quote: "actions that do not depend upon the blockchain state to perform validation"
      // temp1.transactions[4].trx.transaction.actions
      const { transaction = {} } = trx;
      const { context_free_actions = [], actions = [] } = transaction;
      actionsCount += context_free_actions.length + actions.length;
    }
  }
  return actionsCount;
};

const App = () => {

  const remoteBlockProducer = 'https://api.eosnewyork.io';
  const rpc = new JsonRpc(remoteBlockProducer, { fetch });

  const [curBlocks, setCurBlocks] = useState([]);
  const [lastBlockNum, setLastBlockNum] = useState(0);
  const [btnState, setBtnState] = useState('');

  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const MAX_NUM_BLOCKS_TO_SHOW = 10;


  const loadMoreBlocks = async () => {
    setBtnState('loading');
    // fetch the last block number
    const { head_block_num } = await rpc.get_info();
    // how many blocks should we load?
    // Load all blocks since the last fetch
    const numBlocksBehind = head_block_num - lastBlockNum;
    // Max 10 blocks at a time
    const startingBlock = head_block_num - Math.min(MAX_NUM_BLOCKS_TO_SHOW, numBlocksBehind);
    // Load one block at a time starting from the most recent block fetched
    for (let blockNum = startingBlock; blockNum < head_block_num; blockNum++) {
      let newBlock;
      try {
        // note fetching blocks can be slow... maybe fetch them one at a time
        newBlock = await rpc.get_block(blockNum);
      } catch (err) {
        console.log('error fetching block: ', err);
        setBtnState('error');
        setError(err.message);
        throw err;
      }
      // Add the total count of actions here,
      // calculating num of actions here will save us from calling it on every render
      newBlock = {
        ...newBlock,
        actionsCount: getActionsCount(newBlock)
      }
      // Show the new blocks as they come in
      setCurBlocks(oldBlocks => {
        if (oldBlocks.length >= MAX_NUM_BLOCKS_TO_SHOW) {
          let [dropFirst, ...blocks] = oldBlocks;
          return [...blocks, newBlock];
        }
        return [...oldBlocks, newBlock]
      });
      setLastBlockNum(head_block_num);
    }
    setBtnState('success');
    setFeedback('Successfully fetched latest blocks');
  }

  return (
    <main className={style.layout}>
      <div className={style.reloader}>
        <h3>EOS Block Viewer</h3>
        <div>
          <ProgressButton onClick={loadMoreBlocks} state={btnState}>
            Load More
          </ProgressButton>
        </div>
      </div>
        <table className={style.tableWrapper}>
          <thead>
            <tr>
              <th align='left'>Block Hash</th>
              <th align='left'>Timestamp</th>
              <th align='left'>Actions</th>
            </tr>
          </thead>
          <tbody>
          {
            curBlocks.map( (block, i) => (
              <tr key={i}>
                <td>{block.id}</td>
                <td>{block.timestamp}</td>
                <td>{block.actionsCount}</td>
              </tr>
            ))
          }
          </tbody>
        </table>
        <Snackbar open={!!feedback} autoHideDuration={2000} onClose={() => setFeedback(null)}>
          <MuiAlert severity="success">
            {feedback}
          </MuiAlert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError(null)}>
          <MuiAlert severity="error">
            {error}
          </MuiAlert>
        </Snackbar>

    </main>
  );
}

export default App;
