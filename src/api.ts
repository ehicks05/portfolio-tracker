const baseUrl = "https://sandbox.iexapis.com/stable";
const token = import.meta.env.VITE_IEX_API_TOKEN;

const getStockQuotes = async (symbols: string[]) => {
  const response = await fetch(
    `${baseUrl}/stock/market/batch?types=quote&symbols=${symbols.join(
      ","
    )}&token=${token}`
  );
  const json = await response.json();
  return json;
};

const getCryptoQuote = async (symbol: string) => {
  const response = await fetch(
    `${baseUrl}/crypto/${symbol}/quote?token=${token}`
  );
  const json = await response.json();
  return json;
};

const getLogo = async (symbol: string) => {
  const response = await fetch(
    `${baseUrl}/stock/${symbol}/logo?token=${token}`
  );
  const json = await response.json();
  return json.logo;
};

export { getStockQuotes, getCryptoQuote, getLogo };
