const db = require('../db/connection');

/**
 * Calculates Verification Readiness checklist for a request or request_type + citizen_id
 */
async function evaluateVerificationReadiness(citizenId, requestType, requestId = null) {
  // 1. Fetch applicable Document_Requirement records for request_type
  const requirements = await db.query(
    'SELECT requirement_id, request_type, document_type, mandatory, description, source_reference FROM Document_Requirement WHERE request_type = ? AND active = 1',
    [requestType]
  );

  // 2. Fetch citizen uploaded documents
  const citizenDocs = await db.query(
    'SELECT document_id, document_type, document_reference_masked, issue_date, verification_status FROM Document WHERE citizen_id = ?',
    [citizenId]
  );

  // 3. If requestId is provided, fetch linked documents in Request_Document
  let linkedDocIds = [];
  if (requestId) {
    const rdRows = await db.query('SELECT document_id FROM Request_Document WHERE request_id = ?', [requestId]);
    linkedDocIds = rdRows.map(r => r.document_id);
  }

  // 4. Compare requirements against available citizen documents
  const checklist = requirements.map(req => {
    const matchingDoc = citizenDocs.find(d => d.document_type === req.document_type);
    const isAvailable = !!matchingDoc;
    const isLinked = isAvailable && linkedDocIds.includes(matchingDoc.document_id);

    return {
      requirement_id: req.requirement_id,
      request_type: req.request_type,
      document_type: req.document_type,
      mandatory: Boolean(req.mandatory),
      description: req.description,
      source_reference: req.source_reference,
      status: isAvailable ? 'Available' : 'Missing',
      is_linked: isLinked,
      document_details: matchingDoc || null
    };
  });

  const totalRequired = checklist.filter(c => c.mandatory).length;
  const availableRequired = checklist.filter(c => c.mandatory && c.status === 'Available').length;
  const readinessPercentage = totalRequired > 0 ? Math.round((availableRequired / totalRequired) * 100) : 100;

  return {
    citizen_id: citizenId,
    request_type: requestType,
    request_id: requestId,
    total_requirements: checklist.length,
    mandatory_count: totalRequired,
    available_mandatory_count: availableRequired,
    readiness_percentage: readinessPercentage,
    is_ready: availableRequired >= totalRequired,
    checklist,
    disclaimer: "SIRAssist checklist status based on requirements configured in this academic assistance project."
  };
}

module.exports = {
  evaluateVerificationReadiness
};
