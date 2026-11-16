const {test}=require('node:test');
const assert=require('node:assert/strict');
const {forecast}=require('../lib/forecast');
test('stage-weighted forecast uses cent accounting and predictable stage rules',()=>{
 const result=forecast([{stage:'new',value:100},{stage:'proposal',value:49.99},{stage:'won',value:11.30},{stage:'lost',value:1000}]);
 assert.equal(result.deals,4);
 assert.equal(result.total_pipeline_cents,116129);
 assert.equal(result.weighted_forecast_cents,1000+3499+1130);
 assert.equal(result.stages.find(x=>x.stage==='lost').weighted_cents,0);
});
test('empty pipeline has zero-valued stage totals',()=>{
 const result=forecast([]);
 assert.equal(result.weighted_forecast_cents,0);
 assert.equal(result.stages.length,5);
});
test('rejects invalid or negative stored deal data',()=>{
 assert.throws(()=>forecast([{stage:'proposal',value:-1}]),TypeError);
 assert.throws(()=>forecast([{stage:'fake',value:10}]),TypeError);
});
