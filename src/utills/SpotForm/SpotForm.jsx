import React, { useState } from "react";
// css
import "./SpotForm.css";
// components
import RangeSlider from "../RangeSlider/RangeSlider";
import Button from "../Button/Button";
import darkPlugHead from "../../assets/icons/dark-plug-head.png";
//helpers
import { signinzksync, submitorder } from "../../helpers";
import {useAuthContext} from "../../context/authContext";

const SpotForm = (props) => {
    const [price, setPrice] = useState(props.initPrice);
    const [amount, setAmount] = useState("");
    function updatePrice (e) {
        setPrice(e.target.value);
    }
    function updateAmount (e) {
        setAmount(e.target.value);
    }

    const {user,updateUser} = useAuthContext();

    let baseBalance, quoteBalance;
    if (user) {
        baseBalance = user.committed.balances.ETH / Math.pow(10,18);
        quoteBalance = user.committed.balances.USDT / Math.pow(10,6);
    }
    else {
        baseBalance = "-";
        quoteBalance = "-";
    }

    const balanceHtml = (props.side === "buy") ?
              <strong>{quoteBalance} USDT</strong> :
              <strong>{baseBalance} ETH</strong>;

    const signInHandler = async () => {
        try {
            const syncAccountSate = await signinzksync();

            //    updating the user in the context
            updateUser(syncAccountSate);

        } catch (err) {
            console.log(err)
        }
    }

    const buySellBtnClass = "bg_btn " + props.side.toLowerCase() + "_btn"

    async function buySellHandler(e) {
        const side = props.side.charAt(0);
        await submitorder("ETH-USDT", side, price, amount);
    }

  return (
    <>
      <form className="spot_form">
        <div className="spf_head">
          <span>Avbl</span>
          {balanceHtml}
        </div>
        <div className="spf_input_box">
          <span className="spf_desc_text">Price</span>
          <input type="text" value={price} onChange={updatePrice}/>
          <span>USDT</span>
        </div>
        <div className="spf_input_box">
          <span className="spf_desc_text">Amount</span>
          <input type="text" value={amount} onChange={updateAmount}/>
          <span>ETH</span>
        </div>
        <div className="spf_range">
          <RangeSlider />
        </div>
          {
              user ? (
                  <div className="spf_btn">
                      <button type="button" className={buySellBtnClass} onClick={buySellHandler}>{props.side.toUpperCase()}</button>
                  </div>
              ) : (
                  <div className="spf_btn">
                      <Button className="bg_btn" text="CONNECT WALLET" img={darkPlugHead} onClick={signInHandler}/>
                  </div>
              )
          }

      </form>
    </>
  );
};

export default SpotForm;
