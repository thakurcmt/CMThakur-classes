$path = "C:\Users\thaku\OneDrive\Desktop\edu-platform\components\TeacherStudentActivity.js"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$startMarker = "    renderAttendanceTab(students) {"
$endMarker = "    // Render Performance Metrics (test rankings) tab"

$startIdx = $content.IndexOf($startMarker)
$endIdx = $content.IndexOf($endMarker)

if ($startIdx -eq -1 -or $endIdx -eq -1) {
    Write-Error "Markers not found! Start: $startIdx, End: $endIdx"
    exit 1
}

$newImpl = @"
    renderAttendanceTab(students) {
        const div = document.createElement('div');
        const { history, today } = this.getAttendanceData();

        // 1. Checklist
        let checklistHtml = '';
        students.forEach(st => {
            const record = today[st.id];
            const isPresent = record !== undefined ? (typeof record === 'object' ? record.present : record) !== false : true;
            const stayTime = (record && typeof record === 'object') ? (record.stayTimeStr || '0 secs') : '0 secs';
            
            checklistHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background-color: var(--bg-main);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="\${st.avatar}" style="width:32px; height:32px; border-radius:50%; border: 1px solid var(--border);" alt="\${st.name}">
                        <div>
                            <div style="font-weight: 600; font-size:14px;">\${st.name}</div>
                            <div style="font-size:11px; color: var(--text-muted); margin-top:2px;">Stay Time: <strong style="color:var(--primary);">\${stayTime}</strong></div>
                        </div>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                        <input type="checkbox" id="attend-check-\${st.id}" \${isPresent ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                    </label>
                </div>
            `;
        });

        // 2. History logs
        let historyRows = '';
        history.forEach(h => {
            historyRows += `
                <tr style="border-bottom:1px solid var(--border); font-size:13px;">
                    <td style="padding: 10px; font-weight:600;">\${h.date}</td>
                    <td style="padding: 10px;">\${h.presentCount} / \${h.totalCount} Present</td>
                    <td style="padding: 10px; color: var(--text-secondary); max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        \${h.presentNames}
                    </td>
                </tr>
            `;
        });

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px;">
                <!-- Attendance Checklist -->
                <div>
                    <h3 style="font-size:16px; margin-bottom: 12px; font-family: var(--font-heading);">Mark Today's Attendance</h3>
                    <p class="text-secondary" style="font-size:12px; margin-bottom:16px;">Toggles show green for Present, grey for Absent.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom: 20px;">
                        \${checklistHtml}
                    </div>

                    <button class="btn btn-primary" id="btn-save-attendance" style="width:100%;">Save Today's Records</button>
                </div>

                <!-- History log -->
                <div>
                    <h3 style="font-size:16px; margin-bottom: 16px; font-family: var(--font-heading);">Attendance History Log</h3>
                    
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">
                                <th style="padding: 10px;">Date</th>
                                <th style="padding: 10px;">Status Ratio</th>
                                <th style="padding: 10px;">Attendees</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${historyRows}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Custom CSS for toggle switch -->
            <style>
                .switch input:checked + .slider {
                    background-color: var(--primary);
                }
                .switch .slider:before {
                    position: absolute;
                    content: "";
                    height: 14px;
                    width: 14px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                .switch input:checked + .slider:before {
                    transform: translateX(22px);
                }
            </style>
        `;

        // Bind Save Attendance natively
        div.querySelector('#btn-save-attendance').addEventListener('click', () => {
            const todayRecord = {};
            let presentCount = 0;
            const presentNamesList = [];

            students.forEach(st => {
                const checked = div.querySelector(`#attend-check-\${st.id}`).checked;
                const existingRecord = today[st.id] || {};
                const staySeconds = typeof existingRecord === 'object' ? (existingRecord.staySeconds || 0) : 0;
                const stayTimeStr = typeof existingRecord === 'object' ? (existingRecord.stayTimeStr || '0 secs') : '0 secs';
                
                todayRecord[st.id] = {
                    present: checked,
                    staySeconds: staySeconds,
                    stayTimeStr: stayTimeStr
                };
                
                if (checked) {
                    presentCount++;
                    presentNamesList.push(st.name.split(' ')[0]);
                }
            });

            localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todayRecord));

            // Append to history
            const todayDateStr = new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
            
            let currentHistory = history;
            // Remove previous today record if overwrite
            currentHistory = currentHistory.filter(h => h.date !== todayDateStr);

            const attendeesStr = presentCount === students.length ? 'All Present' : (presentNamesList.length > 0 ? presentNamesList.join(', ') : 'None');

            currentHistory.unshift({
                date: todayDateStr,
                presentCount: presentCount,
                totalCount: students.length,
                presentNames: attendeesStr
            });

            localStorage.setItem('edu_teacher_attendance_history', JSON.stringify(currentHistory));
            EduApp.toast.show("Today's attendance has been logged successfully.");

            // Refresh
            const activeViewport = document.getElementById('dashboard-subview-viewport');
            if (activeViewport) {
                activeViewport.innerHTML = '';
                activeViewport.appendChild(this.render());
            }
        });

        return div;
    },
    
"@

$updatedContent = $content.Substring(0, $startIdx) + $newImpl + $content.Substring($endIdx)
[System.IO.File]::WriteAllText($path, $updatedContent, [System.Text.Encoding]::UTF8)

Write-Host "Replacement successful!"
