const fs = require('fs');
const path = require('path');

class PromptfooCustomProvider {
  constructor(config) {
    this.config = config;
  }

  id() {
    return 'cvclinic-precomputed-provider';
  }

  async callApi(prompt, options, context) {
    // Read variables from options.vars or context.vars
    const vars = (options && options.vars) || (context && context.vars) || {};
    const cvName = vars.cv_name || 'SaadAsifResume';
    const targetRole = vars.target_role || '';
    const jobTitle = vars.job_title || '';

    const key = `${cvName}_${targetRole || jobTitle}`;
    const outputsPath = path.join(__dirname, 'promptfoo_outputs.json');
    
    try {
      if (!fs.existsSync(outputsPath)) {
        return {
          error: `Pre-computed outputs file does not exist at ${outputsPath}. Please run the precompute script first.`
        };
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      const analysis = outputs[key];
      
      if (!analysis) {
        return {
          error: `Pre-computed output for key "${key}" not found in ${outputsPath}. Available keys: ${Object.keys(outputs).join(', ')}`
        };
      }

      return {
        output: JSON.stringify(analysis, null, 2)
      };
    } catch (err) {
      return {
        error: `Failed to load pre-computed outputs: ${err.message}`
      };
    }
  }
}

module.exports = PromptfooCustomProvider;
