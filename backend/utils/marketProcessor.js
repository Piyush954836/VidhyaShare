// marketProcessor.js (New utility file)
import { createClient } from "@supabase/supabase-js";
// Import fetchers and upload logic from collectJobs.js (or copy their relevant parts)
import { fetchAdzuna, fetchSalaryBenchmark, uploadToSupabase } from '../data-collector/collectJobs.js'; // ⬅️ Adjust the path as necessary
import dotenv from 'dotenv';
dotenv.config();


const supabaseUrl = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function processNewSkillMarketData(skillName, skillId) {
    try {
        console.log(`[REAL-TIME] Starting market data collection for new skill: ${skillName}`);
        
        const mergedJobs = await fetchAdzuna(skillName);
        const benchmarkSalary = await fetchSalaryBenchmark(skillName);
        
        let jobCount = mergedJobs.length;
        
        // Simplified calculation for immediate points using the benchmark
        const skillValue = jobCount * benchmarkSalary; 

        const finalResults = {
            [skillName]: {
                skillId: skillId,
                jobCount: jobCount,
                jobsWithSalary: 0, // Placeholder
                rawAverageSalary: "0.00", // Placeholder
                effectiveSalary: benchmarkSalary.toFixed(2),
                skillValue: skillValue,
            }
        };

        await uploadToSupabase(finalResults); // Upsert to market_data table
        
        console.log(`[REAL-TIME] Market data published for ${skillName}.`);

    } catch (e) {
        console.error(`[REAL-TIME ERROR] Failed to process market data for ${skillName}:`, e.message);
        // User can still add the skill, but points will be based on fallback until cron runs.
    }
}