import React, { useState, useEffect, FC } from 'react';
import _ from 'lodash';
import { getStockQuotes, getCryptoQuote } from './api';
import accounts from './accounts';
import {
  Portfolio, Account, Holding, Quote, Quotes,
} from './types';
import { calculateTaxes } from './tax';
import { format, formatPercent } from './utils';

const App = () => {
  const [quotes, setQuotes] = useState<Quotes>({});
  const [portfolio] = useState<Portfolio>(accounts);

  useEffect(() => {
    const fetchData = async () => {
      const toSymbols = (accounts: Account[]) => accounts.flatMap((account) => account.holdings.map((holding) => holding.symbol));

      const [cryptoSymbols, tradSymbols] = _.partition(portfolio.accounts, {
        crypto: true,
      }).map(toSymbols);

      const stockQuotes: Quotes = await getStockQuotes(tradSymbols);

      const cryptoQuotes = await Promise.all(
        cryptoSymbols.map((cryptoSymbol) => getCryptoQuote(cryptoSymbol)),
      );
      const reduced: Quotes = cryptoQuotes.reduce(
        (agg, cur) => ({
          ...agg,
          [cur.symbol]: { quote: cur },
        }),
        {},
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
    <div className="flex gap-4 p-4">
      <PortfolioSection portfolio={portfolio} quotes={quotes} />
      <CryptoGainsSection portfolio={portfolio} quotes={quotes} />
      <CryptoTaxesSection portfolio={portfolio} quotes={quotes} />
    </div>
  );
};

const CryptoTaxesSection: FC<{ portfolio: Portfolio; quotes: Quotes }> = ({
  portfolio,
  quotes,
}) => {
  const cryptoAccounts = portfolio.accounts.filter((account) => account.crypto);
  const cryptoHoldings = cryptoAccounts.flatMap((account) => account.holdings);

  const cryptoValue = cryptoHoldings.reduce((agg, curr) => {
    const price = quotes[curr.symbol].quote.latestPrice;
    return (agg + curr.quantity * Number(price));
  }, 0);

  const cryptoBasis = cryptoHoldings.reduce(
    (agg, curr) => (agg + (curr.costBasis || 0)),
    0,
  );

  const cryptoProfit = cryptoValue - cryptoBasis;

  const [cryptoLongTermGains, cryptoShortTermGains] = cryptoHoldings.reduce(
    (agg, curr) => {
      const value = curr.quantity * Number(quotes[curr.symbol].quote.latestPrice);
      const profit = value - (curr.costBasis || 0);
      const longTermGains = profit * (1 - (curr.shortTerm || 0));
      const shortTermGains = profit * (curr.shortTerm || 0);
      return [agg[0] + longTermGains, agg[1] + shortTermGains];
    },
    [0, 0],
  );

  const taxes = calculateTaxes({
    shortTerm: cryptoShortTermGains,
    longTerm: cryptoLongTermGains,
  });

  return (
    <div>
      <header className="text-3xl">Crypto Taxes</header>
      <section className="p-4">
        <Table>
          <tbody>
            <TR>
              <TD className="text-gray-500" />
              <TD className="text-gray-500">Gain</TD>
              <TD colSpan={2} className="text-gray-500">
                Fed
              </TD>
              <TD colSpan={2} className="text-gray-500">
                State
              </TD>
              <TD colSpan={2} className="text-gray-500">
                NIIT
              </TD>
              <TD colSpan={2} className="text-gray-500">
                All Taxes
              </TD>
              <TD className="text-gray-500">Remainder</TD>
            </TR>
            <TR>
              <TD>Long Term</TD>
              <TD>{format(cryptoLongTermGains)}</TD>
              <TD>{format(taxes.longTermFedTax)}</TD>
              <TD>{formatPercent(taxes.longTermFedTaxRate)}</TD>
              <TD />
              <TD />
              <TD />
              <TD />
            </TR>
            <TR>
              <TD>Short Term </TD>
              <TD>{format(cryptoShortTermGains)}</TD>
              <TD>{format(taxes.shortTermFedTax)}</TD>
              <TD>{formatPercent(taxes.shortTermFedTaxRate)}</TD>
              <TD />
              <TD />
              <TD />
              <TD />
            </TR>
            <TR>
              <TD>Total</TD>
              <TD>{format(cryptoProfit)}</TD>
              <TD>{format(taxes.federalTax)}</TD>
              <TD>{formatPercent(taxes.federalTaxRate)}</TD>
              <TD>{format(taxes.stateTax)}</TD>
              <TD>{formatPercent(taxes.stateTaxRate)}</TD>
              <TD>{format(taxes.niit)}</TD>
              <TD>{formatPercent(taxes.niitRate)}</TD>
              <TD>{format(taxes.overallTax)}</TD>
              <TD>{formatPercent(taxes.overallTaxRate)}</TD>
              <TD>{format(taxes.remaining)}</TD>
            </TR>
          </tbody>
        </Table>
      </section>
    </div>
  );
};

const CryptoGainsSection: FC<{ portfolio: Portfolio; quotes: Quotes }> = ({
  portfolio,
  quotes,
}) => {
  const cryptoAccounts = portfolio.accounts.filter((account) => account.crypto);
  const cryptoHoldings = cryptoAccounts.flatMap((account) => account.holdings);

  const cryptoValue = cryptoHoldings.reduce((agg, curr) => {
    const price = quotes[curr.symbol].quote.latestPrice;
    return (agg + curr.quantity * Number(price));
  }, 0);

  const cryptoBasis = cryptoHoldings.reduce(
    (agg, curr) => (agg + (curr.costBasis || 0)),
    0,
  );

  const cryptoProfit = cryptoValue - cryptoBasis;

  const [cryptoLongTermGains, cryptoShortTermGains] = cryptoHoldings.reduce(
    (agg, curr) => {
      const value = curr.quantity * Number(quotes[curr.symbol].quote.latestPrice);
      const profit = value - (curr.costBasis || 0);
      const longTermGains = profit * (1 - (curr.shortTerm || 0));
      const shortTermGains = profit * (curr.shortTerm || 0);
      return [agg[0] + longTermGains, agg[1] + shortTermGains];
    },
    [0, 0],
  );

  return (
    <div>
      <header className="text-3xl">Crypto Gains</header>
      <section className="p-4">
        <Table>
          <tbody>
            {cryptoAccounts.map((account) => (
              <AccountGainsTable
                key={account.label}
                account={account}
                quotes={quotes}
              />
            ))}
            <TR>
              <TD className="pt-4 text-xl">Summary</TD>
            </TR>
            <TR>
              <TD className="text-gray-500" />
              <TD className="text-gray-500">Val</TD>
              <TD className="text-gray-500">Basis</TD>
              <TD className="text-gray-500">Gain</TD>
              <TD className="text-gray-500">LTCG</TD>
              <TD className="text-gray-500">STCG</TD>
            </TR>
            <TR>
              <TD>Total</TD>
              <TD>{format(cryptoValue)}</TD>
              <TD>{format(cryptoBasis)}</TD>
              <TD>{format(cryptoProfit)}</TD>
              <TD>{format(cryptoLongTermGains)}</TD>
              <TD>{format(cryptoShortTermGains)}</TD>
            </TR>
          </tbody>
        </Table>
      </section>
    </div>
  );
};

const PortfolioSection: FC<{ portfolio: Portfolio; quotes: Quotes }> = ({
  portfolio,
  quotes,
}) => (
  <div>
    <header className="text-3xl">Portfolio</header>
    <section className="p-4">
      <Table>
        <tbody>
          {portfolio.accounts.map((account) => (
            <AccountTable
              key={account.label}
              account={account}
              quotes={quotes}
            />
          ))}
        </tbody>
        <tfoot>
          <TR>
            <TD className="pt-4 text-xl">Summary</TD>
          </TR>
          <TR>
            <TD />
            <TD />
            <TD />
            <TD className="text-gray-500">Val</TD>
            <TD />
          </TR>
          <TR>
            <TD>Total</TD>
            <TD />
            <TD />
            <TD>
              {format(
                portfolio.accounts.reduce((agg, curr) => (
                  agg
                      + curr.holdings.reduce((agg, curr) => {
                        const price = quotes[curr.symbol].quote.latestPrice;
                        return (agg + curr.quantity * Number(price));
                      }, 0)
                ), 0),
              )}
            </TD>
            <TD />
          </TR>
        </tfoot>
      </Table>
    </section>
  </div>
);

const AccountTable: FC<{ account: Account; quotes: Quotes }> = ({
  account,
  quotes,
}) => (
  <>
    <TR>
      <TD colSpan={5} className="pt-4 text-left text-xl">
        <div className="flex flex-row items-center gap-4">
          <div>{account.label}</div>
          <div className="px-2 py-1 text-xs bg-green-800 rounded">
            {account.crypto ? 'crypto' : 'traditional'}
          </div>
        </div>
      </TD>
    </TR>
    <TR>
      <TD className="text-gray-500">Symbol</TD>
      <TD className="text-gray-500">Amt</TD>
      <TD className="text-gray-500">Price</TD>
      <TD className="text-gray-500">Val</TD>
    </TR>

    {account.holdings.map((holding) => (
      <HoldingRow
        key={holding.symbol}
        holding={holding}
        quote={quotes[holding.symbol].quote}
      />
    ))}
    <TR>
      <TD>Total</TD>
      <TD />
      <TD />
      <TD>
        {format(
          account.holdings.reduce((agg, curr) => {
            const price = quotes[curr.symbol].quote.latestPrice;
            return (agg + curr.quantity * Number(price));
          }, 0),
        )}
      </TD>
    </TR>
  </>
);

const AccountGainsTable: FC<{ account: Account; quotes: Quotes }> = ({
  account,
  quotes,
}) => (
  <>
    <TR>
      <TD colSpan={5} className="pt-4 text-left text-xl">
        <div className="flex flex-row items-center gap-4">
          <div>{account.label}</div>
          <div className="px-2 py-1 text-xs bg-green-800 rounded">
            {account.crypto ? 'crypto' : 'traditional'}
          </div>
        </div>
      </TD>
    </TR>
    <TR>
      <TD className="text-gray-500">Symbol</TD>
      <TD className="text-gray-500">Val</TD>
      <TD className="text-gray-500">Basis</TD>
      <TD className="text-gray-500">Gain</TD>
      <TD className="text-gray-500">LTCG</TD>
      <TD className="text-gray-500">STCG</TD>
    </TR>

    {account.holdings.map((holding) => (
      <HoldingTaxRow
        key={holding.symbol}
        holding={holding}
        quote={quotes[holding.symbol].quote}
      />
    ))}
    <TR>
      <TD>Total</TD>
      <TD>
        {format(
          account.holdings.reduce((agg, curr) => {
            const price = quotes[curr.symbol].quote.latestPrice;
            return (agg + curr.quantity * Number(price));
          }, 0),
        )}
      </TD>
      <TD>
        {format(
          account.holdings.reduce(
            (agg, curr) => (agg + (curr.costBasis || 0)),
            0,
          ),
        )}
      </TD>
      <TD>
        {format(
          account.holdings.reduce((agg, curr) => {
            const value = curr.quantity * Number(quotes[curr.symbol].quote.latestPrice);
            const basis = curr.costBasis || 0;
            const profit = value - basis;
            return (agg + profit);
          }, 0),
        )}
      </TD>
      <TD />
      <TD />
    </TR>
  </>
);

const HoldingTaxRow: FC<{ holding: Holding; quote: Quote }> = ({
  holding,
  quote,
}) => {
  const value = holding.quantity * Number(quote.latestPrice);
  const profit = value - (holding.costBasis || 0);
  const longTermGains = profit * (1 - (holding.shortTerm || 0));
  const shortTermGains = profit * (holding.shortTerm || 0);

  return (
    <TR>
      <TD title={quote?.companyName}>{holding.symbol}</TD>
      <TD>{format(value)}</TD>
      <TD>{format(holding.costBasis || 0)}</TD>
      <TD>{format(profit)}</TD>
      <TD>{format(longTermGains)}</TD>
      <TD>{format(shortTermGains)}</TD>
    </TR>
  );
};

const HoldingRow: FC<{ holding: Holding; quote: Quote }> = ({
  holding,
  quote,
}) => (
  <TR>
    <TD title={quote?.companyName}>{holding.symbol}</TD>
    <TD>{holding.quantity}</TD>
    <TD>{format(quote.latestPrice)}</TD>
    <TD>{format(holding.quantity * Number(quote.latestPrice))}</TD>
  </TR>
);

const Table: FC = ({ children, ...props }) => (
  <table className="" {...props}>
    {children}
  </table>
);

const TR: FC = ({ children, ...props }) => (
  <tr className="" {...props}>
    {children}
  </tr>
);

const TD: FC<{
  title?: string;
  colSpan?: number;
  className?: string;
}> = ({ children, className, ...props }) => (
  <td
    className={`px-2 py-0.5 ${
      className?.includes('text-left') ? '' : 'text-right'
    } ${className}`}
    {...props}
  >
    {children}
  </td>
);

export default App;
