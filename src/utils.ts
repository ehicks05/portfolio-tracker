const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const format = (input: string | number) => currencyFormat.format(Number(input));

const percentFormat = new Intl.NumberFormat('en-US', {
  style: 'percent',
});

const formatPercent = (input: string | number) => percentFormat.format(Number(input));

export { format, formatPercent };
