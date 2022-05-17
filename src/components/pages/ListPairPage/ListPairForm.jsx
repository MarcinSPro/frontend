import React, { useCallback, useEffect, useState } from "react";
import { x } from "@xstyled/styled-components";
import { Toggle, Tooltip } from "components";
import NumberInput from "../../atoms/Form/NumberInput";
import { model } from "../../atoms/Form/helpers";
import styled from "styled-components";

import {
  forceValidation,
  max,
  min,
  required,
} from "../../atoms/Form/validation";
import SelectInput from "../../atoms/Form/SelectInput";
import { Button } from "../../atoms/Form/Submit";
import TextInput from "../../atoms/Form/TextInput";
import { BsExclamationCircle } from "react-icons/all";
import Form from "../../atoms/Form/Form";
import { TRADING_VIEW_CHART_KEY } from "./ListPairPage";
import api from "../../../lib/api";
import { debounce } from "lodash";

const ListPairContainer = styled.div`
  margin-top: 10px;
  padding: 1rem 18px;
  border: 1px solid ${(p) => p.theme.colors.foreground400};
  border-radius: 8px;
`

const ListPairForm = ({
  onSubmit,
  children
}) => {
  const [baseAssetId, setBaseAssetId] = useState("")
  const [quoteAssetId, setQuoteAssetId] = useState("")
  const [baseFee, setBaseFee] = useState("")
  const [quoteFee, setQuoteFee] = useState("")
  const [basePrice, setBasePrice] = useState(null)
  const [quotePrice, setQuotePrice] = useState(null)
  const [baseSymbol, setBaseSymbol] = useState(null)
  const [quoteSymbol, setQuoteSymbol] = useState(null)
  const [isBaseAssetIdInvalid, setIsBaseAssetIdInvalid] = useState(false)
  const [isQuoteAssetIdInvalid, setIsQuoteAssetIdInvalid] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [zigZagChainId, setZigZagChainId] = useState(1)

  const getTokenInfo = async (
    assetId,
    chainId,
    priceSetter,
    feeSetter,
    symbolSetter,
    isInvalidSetter
  ) => {
    if (assetId && assetId !== "") {
      try {
        const { symbol } = await api.getTokenInfo(assetId, chainId);
        if (symbol) {
          symbolSetter(symbol);
          isInvalidSetter(false);

          try {
            const { price: apiPrice } = await api.getTokenPrice(
              assetId,
              chainId
            );
            const price = Number(apiPrice);
            if (price === 0) {
              throw Error(`${symbol} price came back as 0`);
            }
            priceSetter(price);
            feeSetter(getAmountForTargetNotional(price));
          } catch (e) {
            feeSetter("");
            priceSetter(null);
          }
        }
      } catch (e) {
        symbolSetter(null);
        isInvalidSetter(true);
        feeSetter("");
        priceSetter(null);
      }
    } else {
      symbolSetter(null);
      priceSetter(null);
    }
  };

  const getBaseInfo = (assetId, zigzagId) =>
    getTokenInfo(
      assetId,
      zigzagId,
      setBasePrice,
      setBaseFee,
      setBaseSymbol,
      setIsBaseAssetIdInvalid
    );
  const queryBaseTokenInfo = useCallback(debounce(getBaseInfo, 500), []);
  useEffect(() => {
    queryBaseTokenInfo(baseAssetId, zigZagChainId);
  }, [baseAssetId, zigZagChainId]);

  const getQuoteInfo = (assetId, zigzagId) =>
    getTokenInfo(
      assetId,
      zigzagId,
      setQuotePrice,
      setQuoteFee,
      setQuoteSymbol,
      setIsQuoteAssetIdInvalid
    );
  const queryQuoteTokenInfo = useCallback(debounce(getQuoteInfo, 500), []);
  useEffect(() => {
    queryQuoteTokenInfo(quoteAssetId, zigZagChainId);
  }, [quoteAssetId, zigZagChainId]);

  return (
    <ListPairContainer>
      <PairPreview
        baseAssetId={baseAssetId}
        quoteAssetId={quoteAssetId}
        baseSymbol={baseSymbol}
        quoteSymbol={quoteSymbol}
      />
      <Form
        initialValues={{
          baseAssetId: baseAssetId,
          quoteAssetId: quoteAssetId,
          baseFee: baseFee,
          quoteFee: quoteFee,
          zigzagChainId: zigZagChainId,
          pricePrecisionDecimals: "",
          [TRADING_VIEW_CHART_KEY]: "",
        }}
        onSubmit={onSubmit}
      >
        <x.div
          display={"grid"}
          gridTemplateColumns={2}
          rowGap={21}
          columnGap={24}
          mb={16}
          alignItems="flex-end"
        >
          <NumberInput
            block
            {...model(baseAssetId, setBaseAssetId)}
            label={
              <x.span fontSize={{ xs: 'xs', md: '10px' }} col>
                Base Asset{" "}
                <x.a
                  color={{ _: "blue-gray-500", hover: "teal-200" }}
                  target={"_blank"}
                  href={
                    zigZagChainId === 1
                      ? "https://zkscan.io/explorer/tokens"
                      : "https://rinkeby.zkscan.io/explorer/tokens"
                  }
                >
                  Internal ID
                </x.a>
              </x.span>
            }
            name={"baseAssetId"}
            fontSize={14}
            borderRadius={8}
            validate={[
              required,
              min(0),
              forceValidation(isBaseAssetIdInvalid, "invalid asset on zksync"),
            ]}
            rightOfLabel={
              <TooltipHelper>
                zkSync token ID of the first asset appearing in the pair
                (BASE/QUOTE)
              </TooltipHelper>
            }
          />
          <NumberInput
            block
            {...model(quoteAssetId, setQuoteAssetId)}
            label={
              <x.span fontSize={{ xs: 'xs', md: '10px' }}>
                Quote Asset{" "}
                <x.a
                  color={{ _: "blue-gray-500", hover: "teal-200" }}
                  target={"_blank"}
                  href={
                    zigZagChainId === 1
                      ? "https://zkscan.io/explorer/tokens"
                      : "https://rinkeby.zkscan.io/explorer/tokens"
                  }
                >
                  Internal ID
                </x.a>
              </x.span>
            }
            name={"quoteAssetId"}
            fontSize={14}
            borderRadius={8}
            validate={[
              required,
              min(0),
              forceValidation(isQuoteAssetIdInvalid, "invalid asset on zksync"),
            ]}
            rightOfLabel={
              <TooltipHelper>
                zkSync token ID of the second asset appearing in the pair
                (BASE/QUOTE)
              </TooltipHelper>
            }
          />
          <x.div display={"flex"} flexDirection={"column"}>
            <NumberInput
              block
              name={"baseFee"}
              fontSize={14}
              borderRadius={8}
              {...model(baseFee, setBaseFee)}
              label={baseSymbol ?
                <x.span fontSize={{ xs: 'xs', md: '10px' }}>`${baseSymbol} Swap Fee`</x.span> :
                <x.span fontSize={{ xs: 'xs', md: '10px' }}>Base Swap Fee</x.span>}
              validate={[required, min(0)]}
              rightOfLabel={
                <TooltipHelper>
                  Swap fee collected by market makers
                </TooltipHelper>
              }
            />
            {renderFeeHint(basePrice, baseFee, baseSymbol, setBaseFee)}
          </x.div>
          <x.div display={"flex"} flexDirection={"column"}>
            <NumberInput
              block
              fontSize={14}
              borderRadius={8}
              name={"quoteFee"}
              {...model(quoteFee, setQuoteFee)}
              label={quoteSymbol ? <x.span fontSize={{ xs: 'xs', md: '10px' }}>`${quoteSymbol} Swap Fee`</x.span> :
                <x.span fontSize={{ xs: 'xs', md: '10px' }}>Quote Swap Fee</x.span>}
              validate={[required, min(0)]}
              rightOfLabel={
                <TooltipHelper>
                  Swap fee collected by market makers
                </TooltipHelper>
              }
            />
            {renderFeeHint(quotePrice, quoteFee, quoteSymbol, setQuoteFee)}
          </x.div>
          <NumberInput
            block
            fontSize={14}
            borderRadius={8}
            name={"pricePrecisionDecimals"}
            label={<x.span fontSize={{ xs: 'xs', md: '10px' }}>Price Precision Decimals</x.span>}
            validate={[required, max(10), min(0)]}
            rightOfLabel={
              <TooltipHelper>
                <x.div>
                  Number of decimal places in the price of the asset pair.
                </x.div>

                <x.div display={"grid"} gridTemplateColumns={2} mt={2} gap={0}>
                  <x.div>ex: ETH/USDC has '2'</x.div>
                  <x.div>($3250.61)</x.div>
                  <x.div>ex: ETH/WBTC has '6'</x.div>
                  <x.div>(0.075225)</x.div>
                </x.div>
              </TooltipHelper>
            }
          />
          <SelectInput
            fontSize={10}
            padding={5}
            borderRadius={8}
            {...model(zigZagChainId, setZigZagChainId)}
            name={"zigzagChainId"}
            label={<x.span fontSize={{ xs: 'xs', md: '10px' }}>Network</x.span>}
            items={[
              { name: "zkSync - Mainnet", id: 1 },
              { name: "zkSync - Rinkeby", id: 1000 },
            ]}
            validate={required}
            rightOfLabel={
              <TooltipHelper>
                zkSync network on which the pair will be listed
              </TooltipHelper>
            }
          />
        </x.div>

        <x.div
          h={"1px"}
          w={"full"}
          bg={"blue-gray-800"}
          borderRadius={10}
          mb={21}
        />
        <x.div mb={4}
          ml={5}>
          <x.div
            display={"flex"}
            alignItems={"center"}
            mb={21}
          >
            <Toggle scale="md" font="primaryTiny" leftLabel="Advanced Settings" onChange={() => setShowAdvancedSettings(!showAdvancedSettings)} />
          </x.div>
          {showAdvancedSettings && (
            <>
              {/* <x.div
                h={"1px"}
                w={"full"}
                bg={"blue-gray-800"}
                borderRadius={10}
                mt={21}
              /> */}
              <x.div display={"grid"} gridTemplateColumns={2} columnGap={6} mb={21}>
                <TextInput
                  block
                  name={TRADING_VIEW_CHART_KEY}
                  label={<x.span fontSize={{ xs: 'xs', md: '10px' }}>Default Chart Ticker</x.span>}
                  rightOfLabel={
                    <TooltipHelper>
                      <x.div>
                        Default TradingView chart to be seen on the trade page
                      </x.div>
                      <x.div mt={2}>
                        (ex: show COINBASE:BTCUSD for WBTC-USD)
                      </x.div>
                    </TooltipHelper>
                  }
                />
              </x.div>
            </>
          )}
        </x.div>
        {children}
      </Form>
    </ListPairContainer>
  );
};

const PairPreview = ({
  baseAssetId,
  quoteAssetId,
  baseSymbol,
  quoteSymbol,
}) => {
  return (
    <>
      {(baseAssetId || quoteAssetId) && (
        <x.div display={"flex"} fontSize={35} justifyContent={"center"} my={4}>
          <x.span color={baseSymbol ? "blue-gray-400" : "blue-gray-800"}>
            {baseSymbol ? baseSymbol : "XXX"}
          </x.span>
          <x.span
            color={
              baseSymbol && quoteSymbol ? "blue-gray-400" : "blue-gray-800"
            }
          >
            /
          </x.span>
          <x.span color={quoteSymbol ? "blue-gray-400" : "blue-gray-800"}>
            {quoteSymbol ? quoteSymbol : "XXX"}
          </x.span>
        </x.div>
      )}
    </>
  );
};

const TooltipHelper = ({ children }) => {
  return (
    <Tooltip placement={"right"} label={children}>
      <x.div
        color={"blue-gray-600"}
        ml={-13}
        alignItems={"center"}
      >
        <BsExclamationCircle size={10} color={"primaryHighEmphasis"} />
      </x.div>
    </Tooltip>
  );
};

const getAmountForTargetNotional = (price) => {
  const targetUSDFeeAmount = 1
  return (targetUSDFeeAmount / price).toFixed(6)
}

const renderFeeHint = (assetPrice, assetFee, symbol, feeSetter) => {
  if (assetPrice) {
    const notional = (Number(assetPrice) * Number(assetFee)).toFixed(2)
    if (notional > 0) {
      return <x.div pl={2} fontSize={12} color={"blue-gray-500"} mt={1} display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
        <x.div style={{ wordBreak: "break-all" }}>
          {assetFee} {symbol} = ${notional}
        </x.div>
        {notional > 1 && <x.div>
          <Button
            ml={1}
            variant={"secondary"}
            size={"xs"}
            onClick={() => feeSetter(getAmountForTargetNotional(assetPrice))}>
            set to $1
          </Button>
          <x.div />
        </x.div>}
      </x.div>
    }
  }
  return null
}

export default ListPairForm
