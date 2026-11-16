'use strict';
// Deterministic financial forecast calculated from validated persisted deals.
// Individual amounts are first converted to integer cents to keep displayed
// currency totals stable. These are illustrative stage weights, not AI.
const STAGE_WEIGHTS_BPS = Object.freeze({new:1000,qualified:3500,proposal:7000,won:10000,lost:0});
function forecast(deals) {
  if (!Array.isArray(deals)) throw new TypeError('Expected an array of deals');
  const totals={};
  for (const stage of Object.keys(STAGE_WEIGHTS_BPS)){
    totals[stage]={stage, count:0, value_cents:0, weighted_cents:0, probability_percent:STAGE_WEIGHTS_BPS[stage]/100};
  }
  for (const deal of deals){
    const stage=deal.stage;
    const value=Number(deal.value);
    if (!Object.hasOwn(STAGE_WEIGHTS_BPS,stage) || !Number.isFinite(value) || value<0 || value>1e10){
      throw new TypeError('Unexpected deal stage or amount');
    }
    const cents=Math.round(value*100);
    totals[stage].count++;
    totals[stage].value_cents+=cents;
    totals[stage].weighted_cents+=Math.round(cents*STAGE_WEIGHTS_BPS[stage]/10000);
  }
  const stages=Object.values(totals);
  return {currency:null,assumed_probability_model:'Illustrative stage weights only',
    deals:deals.length, total_pipeline_cents:stages.reduce((sum,x)=>sum+x.value_cents,0),
    weighted_forecast_cents:stages.reduce((sum,x)=>sum+x.weighted_cents,0),stages};
}
module.exports={forecast,STAGE_WEIGHTS_BPS};
