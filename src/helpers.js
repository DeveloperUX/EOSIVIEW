
export const getActionsCount = (block) => {
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
