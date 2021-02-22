import { Button, Spin, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import {
  useConnection,
  useConnectionConfig,
  useSlippageConfig,
} from "../../utils/connection";
import { useWallet } from "../../utils/wallet";
import { CurrencyInput } from "../currencyInput";
import {
  LoadingOutlined,
} from "@ant-design/icons";
import {
  swap,
  usePoolForBasket,
  PoolOperation,
} from "../../utils/pools";
import { notify } from "../../utils/notifications";
import { useCurrencyPairState } from "../../utils/currencyPair";
import { generateActionLabel, POOL_NOT_AVAILABLE, SWAP_LABEL } from "../labels";
import { getTokenName } from "../../utils/utils";
import { AdressesPopover } from "../pool/address";

const { Text } = Typography;

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

export enum PositionType {
  Long,
  Short
}

export const MarginEntry = (props: { type: PositionType }) => {
  const type = props.type;
  const { wallet, connected } = useWallet();
  const connection = useConnection();
  const [pendingTx, setPendingTx] = useState(false);
  const {
    A,
    B,
    leverage,
    setLastTypedAccount,
    setPoolOperation,
    setLeverage,
  } = useCurrencyPairState(3.0);
  const pool = usePoolForBasket([A?.mintAddress, B?.mintAddress]);
  const { slippage } = useSlippageConfig();
  const { tokenMap } = useConnectionConfig();

  const swapAccounts = () => {
    const tempMint = A.mintAddress;
    const tempAmount = A.amount;
    A.setMint(B.mintAddress);
    A.setAmount(B.amount);
    B.setMint(tempMint);
    B.setAmount(tempAmount);
    // @ts-ignore
    setPoolOperation((op: PoolOperation) => {
      switch (+op) {
        case PoolOperation.SwapGivenInput:
          return PoolOperation.SwapGivenProceeds;
        case PoolOperation.SwapGivenProceeds:
          return PoolOperation.SwapGivenInput;
        case PoolOperation.Add:
          return PoolOperation.SwapGivenInput;
      }
    });
  };

  const handleMarginTrade = async () => {
    if (A.account && B.mintAddress) {
      try {
        setPendingTx(true);

        const components = [
          {
            account: A.account,
            mintAddress: A.mintAddress,
            amount: A.convertAmount(),
          },
          {
            mintAddress: B.mintAddress,
            amount: B.convertAmount(),
          },
        ];

        await swap(connection, wallet, components, slippage, pool);
      } catch {
        notify({
          description:
            "Please try again and approve transactions from your wallet",
          message: "Swap trade cancelled.",
          type: "error",
        });
      } finally {
        setPendingTx(false);
      }
    }
  };

  return (
    <>
      <div className="input-card">
        <AdressesPopover pool={pool} />
        <CurrencyInput
          title="Input"
          leverage={leverage}
          onLeverage={setLeverage}
          onInputChange={(val: any) => {
            setPoolOperation(PoolOperation.SwapGivenInput);
            if (A.amount !== val) {
              setLastTypedAccount(A.mintAddress);
            }

            A.setAmount(val);
          }}
          showLeverageSelector={true}
          amount={A.amount}
          mint={A.mintAddress}
          onMintChange={(item) => {
            A.setMint(item);
          }}
        />
        <Button type="primary" className="swap-button" onClick={swapAccounts}>
          ⇅
        </Button>
        <CurrencyInput
          title="To (Estimate)"
          onInputChange={(val: any) => {
            setPoolOperation(PoolOperation.SwapGivenProceeds);
            if (B.amount !== val) {
              setLastTypedAccount(B.mintAddress);
            }

            B.setAmount(val);
          }}
          amount={B.amount}
          mint={B.mintAddress}
          onMintChange={(item) => {
            B.setMint(item);
          }}
        />
      </div>
      <Button
        className="trade-button"
        type="primary"
        size="large"
        onClick={connected ? handleMarginTrade : wallet.connect}
        style={{ width: "100%" }}
        disabled={
          connected &&
          (pendingTx ||
            !A.account ||
            !B.mintAddress ||
            A.account === B.account ||
            !A.sufficientBalance() ||
            !pool)
        }
      >
        {generateActionLabel(
          !pool
            ? POOL_NOT_AVAILABLE(
                getTokenName(tokenMap, A.mintAddress),
                getTokenName(tokenMap, B.mintAddress)
              )
            : SWAP_LABEL,
          connected,
          tokenMap,
          A,
          B,
          true
        )}
        {pendingTx && <Spin indicator={antIcon} className="add-spinner" />}
      </Button>
    </>
  );
};
