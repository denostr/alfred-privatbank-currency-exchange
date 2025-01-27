const alfy = require("alfy");
const numeral = require("numeral");

const getCurrency = require("./get-currency");
const reportFetchRateError = require("./report-fetch-rate-error");
const fixRurToRub = require("./fix-rur-to-rub");
const { requestURL, dividerSymbol } = require("./config");

numeral.defaultFormat("0.00");

module.exports = async operation => {
  const [amount, currency] = alfy.input.toLowerCase().split(" ");

  const userAmount = numeral(amount);
  const userValidCurrency = getCurrency({ name: currency });

  var actionName = "Selling";
  var icon = "./icon/sale.png";
  if (operation === "buy") {
    actionName = "Buying";
    icon = "./icon/buy.png";
  } else if (operation === "medium") {
    actionName = "Medium";
    icon = "./icon/medium.png";
  }

  if (userAmount.value() > 0 && userValidCurrency) {
    const response = fixRurToRub(await alfy.fetch(requestURL));

    if (response.length < 4) {
      reportFetchRateError();
      return;
    }

    const userCurrency = response.find(
      ({ ccy }) => ccy.toLowerCase() === currency
    );

    var resultAmount;
    if (operation === "medium") {
      resultAmount = (parseFloat(userCurrency['buy']) + parseFloat(userCurrency['sale'])) / 2;
    } else {
      resultAmount = userCurrency[operation];
    }

    const total = userAmount.clone().multiply(resultAmount);

    const targetSymbol =
      userCurrency.ccy.toLowerCase() === "btc"
        ? getCurrency({ name: "usd" }).symbol
        : getCurrency({ name: "uah" }).symbol;

    const baseAmount = numeral(userCurrency[operation]).format();
    const title = `${targetSymbol} ${total.format()}`;
    const arg = title;
    const subtitle = `${actionName} ${
      userValidCurrency.symbol
    } ${userAmount.format()} for ${targetSymbol} ${total.format()} ${dividerSymbol} ${
      userValidCurrency.symbol
    } 1 for ${targetSymbol} ${baseAmount}`;

    alfy.output([{ title, subtitle, arg, icon }]);
  } else {
    alfy.output([
      {
        title: `${actionName} ${
          userAmount.value() > 0 ? userAmount.format() : "how much"
        } of which currency?`,
        subtitle: "The format is <amount> <usd | eur | rub | btc>",
        icon: {
          path: "./icon/wait.png",
        },
      },
    ]);
  }
};
