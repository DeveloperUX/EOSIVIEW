import React, { useState, useEffect } from 'react';
import { Api, JsonRpc, RpcError } from 'eosjs';
import style from './app.module.css'

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
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [lastBlockNum, setLastBlockNum] = useState(0);

  const MAX_NUM_BLOCKS_TO_SHOW = 10;


  const loadMoreBlocks = async () => {
    setLoadingRecent(true);
    // fetch the last block number
    const { head_block_num } = await rpc.get_info();
    // how many blocks should we load?
    // Load all blocks since the last fetch
    const numBlocksBehind = head_block_num - lastBlockNum;
    // Max 10 blocks at a time
    const startingBlock = head_block_num - Math.min(MAX_NUM_BLOCKS_TO_SHOW, numBlocksBehind);
    // Load one block at a time starting from the most recent block fetched
    for (let blockNum = startingBlock; blockNum < head_block_num; blockNum++) {
      // note fetching blocks can be slow... maybe fetch them one at a time
      let newBlock = await rpc.get_block(blockNum);
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
    setLoadingRecent(false);
  }

  return (
    <main className={style.layout}>
      <button onClick={loadMoreBlocks} disabled={loadingRecent}>Load More</button>
      <table>
        <thead>
          <tr>
            <th>Block Hash</th>
            <th>Timestamp</th>
            <th>Actions</th>
            <th>block_num</th>
          </tr>
        </thead>
        <tbody>
        {
          curBlocks.map( (block, i) => (
            <tr key={i}>
              <td>{block.id}</td>
              <td>{block.timestamp}</td>
              <td>{block.actionsCount}</td>
              <td>{block.block_num}</td>
            </tr>
          ))
        }
        </tbody>
      </table>
    </main>
  );
}

export default App;
