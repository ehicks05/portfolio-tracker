import { useState, useEffect, FC } from "react";
import _ from "lodash";
import { getStockQuotes, getCryptoQuote } from "./api";
import accounts from "./accounts";
import { Portfolio, Account, Holding, Quote, Quotes } from "./types";

function App() {
  const [quotes, setQuotes] = useState<Quotes>({});
  const [portfolio, setPortfolio] = useState<Portfolio>(accounts);

  useEffect(() => {
    const fetchData = async () => {
      const toSymbols = (accounts: Account[]) =>
        accounts.flatMap((account) =>
          account.holdings.map((holding) => holding.symbol)
        );

      const [cryptoSymbols, tradSymbols] = _.partition(portfolio.accounts, {
        crypto: true,
      }).map(toSymbols);

      const stockQuotes: Quotes = await getStockQuotes(tradSymbols);

      const cryptoQuotes = await Promise.all(
        cryptoSymbols.map((cryptoSymbol) => getCryptoQuote(cryptoSymbol))
      );
      const reduced: Quotes = cryptoQuotes.reduce(
        (agg, cur) => ({
          ...agg,
          [cur.symbol]: { quote: cur },
        }),
        {}
      );

      const quotes = Object.fromEntries([
        ...Object.entries(stockQuotes),
        ...Object.entries(reduced),
      ]);
      console.log(quotes);
      setQuotes(quotes);
    };
    fetchData();
  }, []);

  if (Object.keys(quotes).length === 0) return <div>loading</div>;

  return (
    <div>
      <header className="max-w-screen-xl mx-auto p-4 text-3xl">
        Portfolio
      </header>
      <section className="max-w-screen-xl mx-auto p-4">
        <Table>
          {portfolio.accounts.map((account) => (
            <AccountTable
              key={account.label}
              account={account}
              quotes={quotes}
            />
          ))}
          <tfoot>
            <TR>
              <TD className="pt-4 text-xl">{"Summary"}</TD>
            </TR>
            <TR>
              <TD></TD>
              <TD></TD>
              <TD></TD>
              <TD className="text-gray-500">Val</TD>
              <TD></TD>
            </TR>
            <TR>
              <TD>Total</TD>
              <TD></TD>
              <TD></TD>
              <TD>
                {format(
                  portfolio.accounts.reduce((agg, curr) => {
                    return (
                      agg +
                      curr.holdings.reduce((agg, curr) => {
                        const price = quotes[curr.symbol].quote.latestPrice;
                        return (agg += curr.quantity * Number(price));
                      }, 0)
                    );
                  }, 0)
                )}
              </TD>
              <TD></TD>
            </TR>
          </tfoot>
        </Table>
      </section>
      <div className="h-16"></div>
      <header className="max-w-screen-xl mx-auto p-4 text-3xl">
        Crypto Taxes
      </header>
      <section className="max-w-screen-xl mx-auto p-4">
        <Table>
          <TR>
            <TD className="pt-4 text-xl">Crypto Value:</TD>
          </TR>
          <TR>
            <TD className="pt-4 text-xl">Crypto Cost Basis:</TD>
          </TR>
          <TR>
            <TD className="pt-4 text-xl">Crypto Profit:</TD>
          </TR>
          {portfolio.accounts
            .filter((account) => account.crypto)
            .map((account) => (
              <AccountTable
                key={account.label}
                account={account}
                quotes={quotes}
              />
            ))}
        </Table>
      </section>
    </div>
  );
}

const AccountTable: FC<{
  account: Account;
  quotes: Quotes;
}> = ({ account, quotes }) => {
  return (
    <>
      <thead>
        <TR>
          <TD colSpan={5} className="pt-4 text-left text-xl">
            <div className="flex flex-row items-center gap-4">
              <div>{account.label}</div>
              <div className="px-2 py-1 text-xs bg-green-800 rounded-full ">
                {account.crypto ? "crypto" : "traditional"}
              </div>
            </div>
          </TD>
        </TR>
        <TR>
          <TD className="text-gray-500">Symbol</TD>
          <TD className="text-gray-500">Amt</TD>
          <TD className="text-gray-500">Price</TD>
          <TD className="text-gray-500">Val</TD>
          <TD className="text-gray-500">Basis</TD>
        </TR>
      </thead>
      <tbody>
        {account.holdings.map((holding) => (
          <HoldingRow
            key={holding.symbol}
            holding={holding}
            quote={quotes[holding.symbol].quote}
          />
        ))}
        <TR>
          <TD>Total</TD>
          <TD></TD>
          <TD></TD>
          <TD>
            {format(
              account.holdings.reduce((agg, curr) => {
                const price = quotes[curr.symbol].quote.latestPrice;
                return (agg += curr.quantity * Number(price));
              }, 0)
            )}
          </TD>
          <TD></TD>
        </TR>
      </tbody>
    </>
  );
};

const HoldingRow: FC<{ holding: Holding; quote: Quote }> = ({
  holding,
  quote,
}) => {
  return (
    <TR>
      <TD title={quote?.companyName}>{holding.symbol}</TD>
      <TD>{holding.quantity}</TD>
      <TD>{format(quote.latestPrice)}</TD>
      <TD>{format(holding.quantity * Number(quote.latestPrice))}</TD>
      <TD>{holding.costBasis}</TD>
    </TR>
  );
};

const Table: FC = ({ children, ...props }) => {
  return (
    <table className="" {...props}>
      {children}
    </table>
  );
};

const TR: FC = ({ children, ...props }) => {
  return (
    <tr className="" {...props}>
      {children}
    </tr>
  );
};

const TD: FC<{
  title?: string;
  colSpan?: number;
  className?: string;
}> = ({ children, className, ...props }) => {
  return (
    <td
      className={`px-2 py-0.5 ${
        className?.includes("text-left") ? "" : "text-right"
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

const format = (input: string | number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(input));
};

export default App;
