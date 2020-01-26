import React, { useState, useEffect } from 'react';
import { Api, JsonRpc, RpcError } from 'eosjs';
import style from './app.module.css'

const App = () => {

  const remoteBlockProducer = 'https://api.eosnewyork.io';
  const rpc = new JsonRpc(remoteBlockProducer, { fetch });

  const [curBlocks, setCurBlocks] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [lastBlockNum, setLastBlockNum] = useState(0);


  const loadMoreBlocks = async () => {
    const newBlocks = [];
    setLoadingRecent(true);
    // fetch the last block number
    const { head_block_num } = await rpc.get_info();
    // how many blocks should we load?
    // Load all blocks since the last fetch
    const numBlocksBehind = head_block_num - lastBlockNum;
    // Max 10 blocks at a time
    const startingBlock = head_block_num - Math.min(10, numBlocksBehind);
    // Load one block at a time starting from the most recent block fetched
    for (let blockNum = startingBlock; blockNum < head_block_num; blockNum ++) {
      const block = await rpc.get_block(blockNum);
      newBlocks.push(block);
    }

    setCurBlocks(newBlocks);
    setLastBlockNum(head_block_num);
    setLoadingRecent(false);
  }

  return (
    <main className={style.layout}>
      <button onClick={loadMoreBlocks}>Load More</button>
      <table>
        <thead>
          <tr>
          <th>Block Hash</th>
          <th>Timestamp</th>
          <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {
          curBlocks.map( (block, i) => (
            <tr key={i}>
              <td>{block.id}</td>
              <td>{block.timestamp}</td>
              <td>{block.actions}</td>
            </tr>
          ))
        }
        </tbody>
      </table>
    </main>
  );
}

export default App;
