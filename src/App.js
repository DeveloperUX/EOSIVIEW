import React, { useState, useEffect } from 'react';
import { Api, JsonRpc, RpcError } from 'eosjs';
import style from './app.module.css'

const App = () => {

  const remoteBlockProducer = 'https://api.eosnewyork.io';
  const rpc = new JsonRpc(remoteBlockProducer, { fetch });

  const [curBlocks, setCurBlocks] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [lastBlockNum, setLastBlockNum] = useState(0);

  const MAX_NUM_BLOCKS_TO_SHOW = 10;


  const loadMoreBlocks = async () => {
    const newBlocks = [];
    setLoadingRecent(true);
    // fetch the last block number
    const { head_block_num } = await rpc.get_info();
    // how many blocks should we load?
    // Load all blocks since the last fetch
    const numBlocksBehind = head_block_num - lastBlockNum;
    // Max 10 blocks at a time
    const startingBlock = head_block_num - Math.min(MAX_NUM_BLOCKS_TO_SHOW, numBlocksBehind);
    // Load one block at a time starting from the most recent block fetched
    for (let blockNum = startingBlock; blockNum < head_block_num; blockNum ++) {
      // note fetching blocks can be slow... maybe fetch them one at a time
      const newBlock = await rpc.get_block(blockNum);
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
              <td>{block.actions}</td>
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
