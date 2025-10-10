import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js"; // NEW: Supabase Client

dotenv.config();

// --- Supabase Setup ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY; // Use Service Key for server-side writes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Configuration ---
const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const ABSOLUTE_FALLBACK_SALARY = 60000; 

// --- Utility Functions (delay, fetchWithRetry, validateAndAnnualizeSalary) ---
// Note: These functions are assumed to be pasted from the last working version.
// For brevity, I'm omitting them here, but they MUST be included in your file.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, skill, source) {
  // ... (Your latest fetchWithRetry function) ...
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.status === 200) {
        return await res.json();
      }

      console.warn(
        `${source} returned status ${res.status} for skill "${skill}" (attempt ${attempt})`
      );

      if (res.status === 429) {
        const waitTime = BASE_DELAY * 2 ** (attempt - 1);
        console.log(`Waiting ${waitTime}ms before retrying...`);
        await delay(waitTime);
      } else if (res.status === 400 || res.status === 403 || res.status === 404) {
        break; 
      }
    } catch (err) {
      console.error(`${source} fetch error for "${skill}":`, err.message);
      await delay(BASE_DELAY * attempt);
    }
  }
  return null;
}

function validateAndAnnualizeSalary(rawSalary, location) {
    if (!rawSalary) return 0;
    let salaryText = String(rawSalary).toLowerCase().replace(/[,$\u20b9£€]/g, '').trim();
    if (!salaryText || salaryText === '0' || salaryText.includes('confidential')) return 0;
    
    let match = salaryText.match(/[\d.]+/);
    if (!match) return 0;
    
    let rate = parseFloat(match[0]);
    if (isNaN(rate) || rate <= 0) return 0;

    let annualRate = rate;
    
    if (salaryText.includes('day') || salaryText.includes('hour') || salaryText.includes('hr')) {
        annualRate = rate * 2080; 
    } else if (salaryText.includes('month') || salaryText.includes('mo')) {
        annualRate = rate * 12;
    } else if (salaryText.includes('k')) {
        annualRate = rate * 1000;
    } else if (salaryText.includes('lpa') || salaryText.includes('lac')) {
        annualRate = rate * 100000;
    }
    
    if (annualRate < 12000) { 
        return 0;
    }

    return annualRate;
}

// Fetchers (Adzuna and Glassdoor) are assumed to be here, too.

/**
 * Fetch jobs from Adzuna (India) - PRIMARY SOURCE FOR JOB COUNT
 */
export async function fetchAdzuna(skill) {
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(
      skill
    )}&content-type=application/json`;

    const data = await fetchWithRetry(url, {}, skill, "Adzuna");
    if (!data || !data.results) return [];

    return data.results.map((job) => ({
      title: job.title || "Unknown",
      description: job.description || "", 
      company: job.company?.display_name || "Unknown",
      location: job.location?.display_name || "Unknown",
      salary: job.salary_max || 0,
      source: "Adzuna",
    }));
}


/**
 * Glassdoor Salary Benchmark Function - PRIMARY SOURCE FOR SALARY BENCHMARK
 */
export async function fetchSalaryBenchmark(skill) {
    const jobTitle = `${skill} Developer`; 
    const location = 'United States'; 

    const url = `https://${process.env.RAPIDAPI_GLASSDOOR_HOST}/salaries/search?query=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`;
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_GLASSDOOR_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_GLASSDOOR_HOST,
        },
    };

    const data = await fetchWithRetry(
        url,
        options,
        skill,
        "Glassdoor-Salary"
    );
    
    let benchmarkSalary = 0;

    if (data && data.data && data.data.aggregateSalaryResponse) {
        const results = data.data.aggregateSalaryResponse.results;
        
        if (results && results.length > 0) {
            const firstEntry = results[0];
            const baseStats = firstEntry.basePayStatistics;

            if (baseStats) {
                // FIX: Extract the 'mean' value confirmed from debugging
                benchmarkSalary = baseStats.mean || 0; 
            }
        }
    }

    return benchmarkSalary > 10000 ? benchmarkSalary : ABSOLUTE_FALLBACK_SALARY;
}


// --- NEW: Function to upload results to Supabase ---
export async function uploadToSupabase(finalResults) {
    // 1. Map results to the required Supabase schema
    const records = Object.keys(finalResults).map(skillName => {
        const result = finalResults[skillName];
        return {
            skill_id: result.skillId, // Must match the skill_id from the database
            effective_salary: parseFloat(result.effectiveSalary),
            skill_value_potential: result.skillValue,
            job_count: result.jobCount,
            last_updated: new Date().toISOString()
        };
    });

    // 2. Perform upsert (Insert/Update)
    const { error } = await supabase
        .from('market_data')
        .upsert(records, { 
            onConflict: 'skill_id', 
            // Ensures the response from the DB is visible for debugging
            returning: 'minimal' 
        }); 

    if (error) {
        console.error('❌ Supabase Upload Error:', error.message);
        throw new Error('Failed to upload data to market_data table.');
    } else {
        console.log(`✅ Successfully uploaded ${records.length} skill values to Supabase.`);
    }
}


// --- Main Logic (Dynamic) ---

async function calculateSkillValues(skillsToProcess) {
  let mergedJobs = [];
  const salaryCache = {};
  const skillPoints = {};
  
  // 1. Fetch Data
  for (const skill of skillsToProcess) {
    console.log(`\n🔎 Fetching data for skill: ${skill.name} (ID: ${skill.id})`);

    // --- Collect Job Count ---
    const adzunaJobs = await fetchAdzuna(skill.name);
    mergedJobs.push(...adzunaJobs);

    // --- Get Salary Benchmark (Glassdoor) ---
    if (!salaryCache[skill.name]) {
      salaryCache[skill.name] = await fetchSalaryBenchmark(skill.name);
    }
    
    await delay(BASE_DELAY * 2); // Inter-skill delay
  }

  // 2. Process and Calculate Skill Points
  console.log("\n📊 Processing job data and calculating skill points...");

  for (const job of mergedJobs) {
    // We now match against the dynamic list of skillsToProcess
    const titleLower = job.title.toLowerCase();
    const descriptionLower = job.description ? job.description.toLowerCase() : '';

    const matchingSkills = skillsToProcess.filter(
        (s) => {
            const sLower = s.name.toLowerCase();
            return titleLower.includes(sLower) || descriptionLower.includes(sLower);
        }
    );

    if (matchingSkills.length === 0) continue;

    const validatedSalary = validateAndAnnualizeSalary(job.salary, job.location);

    for (const skill of matchingSkills) {
      const skillName = skill.name;
      if (!skillPoints[skillName]) {
        skillPoints[skillName] = { 
          skillId: skill.id, // NEW: Store ID for Supabase upsert
          jobCount: 0, 
          countWithSalary: 0, 
          totalSalary: 0,
          benchmarkSalary: salaryCache[skillName]
        };
      }

      skillPoints[skillName].jobCount += 1;
      
      if (validatedSalary > 0) {
        skillPoints[skillName].countWithSalary += 1;
        skillPoints[skillName].totalSalary += validatedSalary;
      }
    }
  }

  // 3. Finalize Averages and Points
  const finalResults = {};
  for (const skillName in skillPoints) {
    const data = skillPoints[skillName];
    
    const rawAverageSalary = data.countWithSalary 
      ? data.totalSalary / data.countWithSalary
      : 0;
      
    const effectiveSalary = rawAverageSalary > 0
      ? rawAverageSalary
      : data.benchmarkSalary;

    finalResults[skillName] = {
      skillId: data.skillId,
      jobCount: data.jobCount,
      jobsWithSalary: data.countWithSalary,
      rawAverageSalary: rawAverageSalary.toFixed(2),
      effectiveSalary: effectiveSalary.toFixed(2),
      skillValue: data.jobCount * effectiveSalary, // Raw Skill Value Potential
    };
  }

  // 4. Upload Results to Supabase
  await uploadToSupabase(finalResults);
}


// --- Initialization Function ---
export async function runFullMarketUpdate() {
    try {
        console.log("Starting Market Data Collector...");
        
        // 1. Fetch ALL skills from the database
        const { data: skillsData, error } = await supabase
            .from('skills')
            .select('id, name');

        if (error) throw error;
        if (!skillsData || skillsData.length === 0) {
            console.log("WARNING: No skills found in the database. Exiting.");
            return;
        }

        console.log(`Successfully retrieved ${skillsData.length} skills for processing.`);

        // 2. Run the calculation and upload process
        await calculateSkillValues(skillsData);

    } catch (e) {
        console.error("FATAL ERROR during initialization:", e.message);
    }
}

