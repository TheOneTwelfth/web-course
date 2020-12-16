var utils = require('../../public/js/utils');

var chai = require('chai');


describe('Frontend Utils', () => {
    describe('Construct Node ID', () => {
        it('should construct valid node id', () => {
            let rawName = "New York City";
            let nodeId = utils.constructNodeId(rawName);

            chai.expect(nodeId).to.be.equal('newyorkcity');
        });
    });
});
