const Home = {
  template: `
    <el-main>
        <!-- 模板管理 -->
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <span>模板管理</span>
                    <el-upload
                        action="/api/templates/upload"
                        :on-success="handleTemplateSuccess"
                        :on-error="handleTemplateError"
                        :show-file-list="false">
                        <el-button type="primary">上传模板</el-button>
                    </el-upload>
                </div>
            </template>
            <el-table :data="templates" style="width: 100%" @row-click="showPlaceholders">
                <el-table-column prop="name" label="模板名称"></el-table-column>
                <el-table-column prop="updated_at" label="       "></el-table-column>
                <el-table-column label="操作" align="right" header-align="right">
                    <template #default="scope">
                        <el-button size="small" type="danger" @click.stop="deleteTemplate(scope.row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 最近报告 -->
        <el-card class="box-card" style="margin-top: 20px;">
            <template #header>
                <div class="card-header">
                    <span>最近报告</span>
                    <el-button type="success" @click="newReport">新建报告</el-button>
                </div>
            </template>
            <el-table :data="reports" style="width: 100%">
                <el-table-column prop="report_systemname" label="项目名称"></el-table-column>
                <el-table-column prop="report_center" label="客户名称"></el-table-column>
                <el-table-column prop="updated_at" label="更新时间"></el-table-column>
                <el-table-column label="操作" align="right" header-align="right">
                    <template #default="scope">
                        <el-button size="small" @click="editReport(scope.row.id)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteReport(scope.row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 新建/编辑报告抽屉 -->
        <el-drawer v-model="reportDrawer.visible" :title="reportDrawer.title" direction="rtl" size="60%">
            <div class="drawer-body">
                <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px;">
                    <el-step title="基础信息"></el-step>
                    <el-step title="漏洞与截图"></el-step>
                    <el-step title="预览与导出"></el-step>
                </el-steps>

                <!-- 步骤一：基础信息 -->
                <div v-if="activeStep === 0">
                    <el-form :model="currentReport" label-width="120px">
                        <el-form-item label="客户公司全称" help="对应占位符: {{report_center}}">
                            <el-input v-model="currentReport.report_center"></el-input>
                        </el-form-item>
                        <el-form-item label="客户公司简称" help="对应占位符: {{report_center_short}}">
                            <el-input v-model="currentReport.report_center_short"></el-input>
                        </el-form-item>
                        <el-form-item label="系统名称" help="对应占位符: {{report_systemname}}">
                            <el-input v-model="currentReport.report_systemname"></el-input>
                        </el-form-item>
                        <el-form-item label="报告开始时间" help="对应占位符: {{report_start_time}}">
                            <el-date-picker v-model="currentReport.report_start_time" type="date" placeholder="选择日期"></el-date-picker>
                        </el-form-item>
                        <el-form-item label="报告结束时间" help="对应占位符: {{report_end_time}}">
                            <el-date-picker v-model="currentReport.report_end_time" type="date" placeholder="选择日期"></el-date-picker>
                        </el-form-item>
                        <el-form-item label="编制人员" help="对应占位符: {{author}}">
                            <el-input v-model="currentReport.author"></el-input>
                        </el-form-item>
                        <el-form-item label="审核人员" help="对应占位符: {{reviewer}}">
                            <el-input v-model="currentReport.reviewer"></el-input>
                        </el-form-item>

                        <h4>测试对象</h4>
                        <el-card v-for="(target, index) in currentReport.targets" :key="index" class="list-item-card">
                            <template #header>
                                <div class="card-header">
                                    <span>测试对象 {{ index + 1 }}</span>
                                    <el-button @click="removeTarget(index)" type="danger" link>删除</el-button>
                                </div>
                            </template>
                            <el-form-item label="系统名称">
                                <el-input v-model="target.name" placeholder="系统名称"></el-input>
                            </el-form-item>
                            <el-form-item label="URL">
                                <el-input v-model="target.url" placeholder="URL"></el-input>
                            </el-form-item>
                        </el-card>
                        <el-button @click="addTarget" type="primary" style="margin-top: 10px;">添加测试对象</el-button>

                        <h4 style="margin-top: 20px;">项目成员</h4>
                        <el-card v-for="(member, index) in currentReport.members" :key="index" class="list-item-card">
                             <template #header>
                                <div class="card-header">
                                    <span>项目成员 {{ index + 1 }}</span>
                                    <el-button @click="removeMember(index)" type="danger" link>删除</el-button>
                                </div>
                            </template>
                            <el-row :gutter="20">
                                <el-col :span="8">
                                    <el-form-item label="角色">
                                        <el-input v-model="member.role" placeholder="角色"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                     <el-form-item label="姓名">
                                        <el-input v-model="member.name" placeholder="姓名"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                     <el-form-item label="联系方式">
                                        <el-input v-model="member.contact" placeholder="联系方式"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-card>
                        <el-button @click="addMember" type="primary" style="margin-top: 10px;">添加项目成员</el-button>
                    </el-form>
                </div>

                <!-- 步骤二：漏洞与截图 -->
                <div v-if="activeStep === 1">
                    <el-row :gutter="20" style="margin-bottom: 15px;">
                        <el-col :span="12">
                            <el-button @click="addVulnerability" type="primary">添加新漏洞</el-button>
                            <el-button @click="showVulnerabilityLibrary" type="success">从知识库添加</el-button>
                        </el-col>
                        <el-col :span="12">
                             <el-form-item label="整体安全风险" label-width="100px" class="small-label-form-item">
                                <el-input :value="overallRiskLevel" readonly placeholder="根据漏洞列表自动计算" style="font-size: 12px;"></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-collapse v-model="activeVulnerability">
                        <el-collapse-item v-for="(vul, index) in currentReport.vuls" :key="index" :name="index">
                            <template #title>
                                {{ vul.vul_name || '新漏洞' }}
                            </template>
                            <el-form :model="vul" label-position="top">
                                <el-form-item label="漏洞名称" help="占位符: {{vul.vul_name}}">
                                    <el-input v-model="vul.vul_name"></el-input>
                                </el-form-item>
                                <el-form-item label="风险等级" help="占位符: {{vul.vul_level}}">
                                    <el-select v-model="vul.vul_level" placeholder="选择风险等级">
                                        <el-option label="高危" value="High"></el-option>
                                        <el-option label="中危" value="Medium"></el-option>
                                        <el-option label="低危" value="Low"></el-option>
                                    </el-select>
                                </el-form-item>
                                <el-form-item label="漏洞描述" help="占位符: {{vul.vul_describe}}">
                                    <el-input v-model="vul.vul_describe" type="textarea"></el-input>
                                </el-form-item>
                                <el-form-item label="漏洞URL" help="占位符: {{vul.vul_url}}">
                                    <el-input v-model="vul.vul_url"></el-input>
                                </el-form-item>
                                <el-form-item label="漏洞分析" help="占位符: {{vul.vul_analysis}} (此项为富文本)">
                                    <div style="border: 1px solid #ccc; border-radius: 4px;">
                                        <div :id="'toolbar-container-' + index"></div>
                                        <div :id="'editor-container-' + index" style="height: 300px;"></div>
                                    </div>
                                </el-form-item>
                                <el-form-item label="加固建议" help="占位符: {{vul.vul_modify_repair}}">
                                    <el-input v-model="vul.vul_modify_repair" type="textarea"></el-input>
                                </el-form-item>
                                <el-button type="danger" @click="removeVulnerability(index)">删除此漏洞</el-button>
                            </el-form>
                        </el-collapse-item>
                    </el-collapse>
                </div>

                <!-- 步骤三：预览与导出 -->
                <div v-if="activeStep === 2">
                    <el-form label-width="120px">
                        <el-form-item label="选择模板">
                            <el-select v-model="selectedTemplate" placeholder="请选择一个模板">
                                <el-option
                                    v-for="item in templates"
                                    :key="item.id"
                                    :label="item.name"
                                    :value="item.id">
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
            <template #footer>
                <div style="flex: auto">
                    <el-button @click="prevStep" v-if="activeStep > 0">上一步</el-button>
                    <el-button @click="saveReport" type="warning">仅保存</el-button>
                    <el-button type="primary" @click="nextStep" v-if="activeStep < 2">下一步</el-button>
                    <el-button type="success" @click="generateAndDownload" v-if="activeStep === 2" :disabled="!selectedTemplate">
                        生成并下载
                    </el-button>
                </div>
            </template>
        </el-drawer>

        <!-- 漏洞知识库弹窗 -->
        <vulnerability-library
            v-model:visible="vulnerabilityLibraryVisible"
            @add-vulnerabilities="addVulnerabilitiesFromLibrary"
        >
        </vulnerability-library>

        <!-- 占位符显示对话框 -->
        <el-dialog v-model="placeholderDialog.visible" :title="placeholderDialog.title" width="50%">
            <el-tag v-for="v in placeholderDialog.data.vars" :key="v" style="margin: 4px;">{{ v }}</el-tag>
            <el-tag v-for="img in placeholderDialog.data.images" :key="img" type="success" style="margin: 4px;">{{ img }}</el-tag>
            <div v-for="(loop, name) in placeholderDialog.data.loops" :key="name">
                <strong>循环块: {{ name }}</strong>
                <div v-if="loop.vars && loop.vars.length > 0">
                    <el-tag v-for="v in loop.vars" :key="v" type="warning" style="margin: 4px;">{{ v }}</el-tag>
                </div>
                <div v-else>
                    <el-tag type="info" style="margin: 4px;">(无内部变量)</el-tag>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="placeholderDialog.visible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </el-main>
  `,
  setup() {
    const { ref, reactive, onMounted, watch, computed, nextTick, onUpdated } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    const editorInstances = ref({});

    // --- 响应式数据 ---
    const templates = ref([]);
    const reports = ref([]);
    const reportDrawer = ref({ visible: false, title: '新建报告' });
    const activeStep = ref(0);
    const currentReport = reactive({ vuls: [], targets: [], members: [] });
    const selectedTemplate = ref(null);
    const activeVulnerability = ref([]);
    const placeholderDialog = ref({
        visible: false,
        title: '',
        data: { vars: [], images: [], loops: {} }
    });
    const vulnerabilityLibraryVisible = ref(false);

    // --- 计算属性 ---
    const overallRiskLevel = computed(() => {
        const levels = currentReport.vuls.map(v => v.vul_level);
        if (levels.includes('High')) return '高危';
        if (levels.includes('Medium')) return '中危';
        if (levels.includes('Low')) return '低危';
        return '无风险';
    });

    // --- 辅助方法 ---
    const updateCurrentReportData = (reportData) => {
        Object.keys(reportData).forEach(key => {
            if (key !== 'vuls' && key !== 'targets' && key !== 'members') {
                currentReport[key] = reportData[key];
            }
        });
        currentReport.vuls.length = 0;
        Array.prototype.push.apply(currentReport.vuls, reportData.vuls || []);
        currentReport.targets.length = 0;
        Array.prototype.push.apply(currentReport.targets, reportData.targets || []);
        currentReport.members.length = 0;
        Array.prototype.push.apply(currentReport.members, reportData.members || []);
    };

    // --- API 调用 ---
    const fetchTemplates = async () => {
        try {
            const response = await axios.get('/api/templates/');
            templates.value = response.data;
        } catch (error) {
            ElMessage.error('获取模板列表失败');
        }
    };
    const fetchReports = async () => {
        try {
            const response = await axios.get('/api/reports/');
            reports.value = response.data;
        } catch (error) {
            ElMessage.error('获取报告列表失败');
        }
    };

    // --- 事件处理 ---
    const handleTemplateSuccess = (response, file) => {
        ElMessage.success(`模板 ${file.name} 上传成功`);
        fetchTemplates();
    };
    const handleTemplateError = (error, file) => {
        const err = JSON.parse(error.message);
        ElMessage.error(`模板上传失败: ${err.detail || '未知错误'}`);
    };
    const deleteTemplate = async (id) => {
        try {
            await ElMessageBox.confirm('此操作将永久删除该模板, 是否继续?', '提示', { type: 'warning' });
            await axios.delete(`/api/templates/${id}`);
            ElMessage.success('删除成功');
            fetchTemplates();
        } catch (error) {
            if (error !== 'cancel') ElMessage.error('删除失败');
        }
    };
    const deleteReport = async (id) => {
        try {
            await ElMessageBox.confirm('此操作将永久删除该报告, 是否继续?', '提示', { type: 'warning' });
            await axios.delete(`/api/reports/${id}`);
            ElMessage.success('删除成功');
            fetchReports();
        } catch (error) {
            if (error !== 'cancel') ElMessage.error('删除失败');
        }
    };

    // --- 报告抽屉逻辑 ---
    const newReport = () => {
        updateCurrentReportData({
            id: null, report_center: '', report_systemname: '', report_start_time: '',
            report_end_time: '', author: '', reviewer: '', report_center_short: '',
            vuls: [], targets: [], members: [],
        });
        activeStep.value = 0;
        reportDrawer.value = { visible: true, title: '新建报告' };
    };
    const editReport = async (id) => {
        try {
            const response = await axios.get(`/api/reports/${id}`);
            updateCurrentReportData(response.data);
            activeStep.value = 0;
            reportDrawer.value = { visible: true, title: '编辑报告' };
        } catch (error) {
            ElMessage.error('获取报告详情失败');
        }
    };
    const nextStep = () => { if (activeStep.value < 2) activeStep.value++; };
    const prevStep = () => { if (activeStep.value > 0) activeStep.value--; };

    // --- 动态列表管理 ---
    const addVulnerability = () => {
        currentReport.vuls.push({
            vul_name: '新漏洞', vul_level: 'Medium', vul_describe: '',
            vul_url: '', vul_analysis: '', vul_modify_repair: '',
        });
        nextTick(() => {
             activeVulnerability.value = [currentReport.vuls.length - 1];
        });
    };
    const removeVulnerability = (index) => { currentReport.vuls.splice(index, 1); };
    const addTarget = () => { currentReport.targets.push({ name: '', url: '' }); };
    const removeTarget = (index) => { currentReport.targets.splice(index, 1); };
    const addMember = () => { currentReport.members.push({ role: '', name: '', contact: '' }); };
    const removeMember = (index) => { currentReport.members.splice(index, 1); };

    // --- 编辑器生命周期管理 ---
    const createEditor = (index) => {
        const toolbarContainer = document.getElementById(`toolbar-container-${index}`);
        const editorContainer = document.getElementById(`editor-container-${index}`);
        if (!toolbarContainer || !editorContainer || editorInstances.value[index]) return;

        const editorConfig = {
            placeholder: '请输入内容...',
            onChange(editor) {
                currentReport.vuls[index].vul_analysis = editor.getHtml();
            },
            MENU_CONF: {
                uploadImage: {
                    server: '/api/images/upload',
                    fieldName: 'file',
                    customInsert(res, insertFn) {
                        if (res.data && res.data.url) {
                            insertFn(res.data.url, res.data.alt, res.data.href);
                        } else {
                            ElMessage.error('图片上传失败');
                        }
                    },
                }
            }
        };
        const editor = window.wangEditor.createEditor({
            selector: editorContainer,
            html: currentReport.vuls[index].vul_analysis || '',
            config: editorConfig,
        });
        const toolbar = window.wangEditor.createToolbar({
            editor,
            selector: toolbarContainer,
        });
        editorInstances.value[index] = { editor, toolbar };
    };
    const destroyEditors = () => {
        Object.values(editorInstances.value).forEach(({ editor }) => {
            if (editor) editor.destroy();
        });
        editorInstances.value = {};
    };

    // --- 编辑器最终的、决定性的生命周期管理 ---

    // 核心逻辑：当用户切换到“漏洞与截图”步骤时，创建所有编辑器。
    watch(activeStep, (newStep) => {
        if (newStep === 1) {
            // 使用 nextTick 确保 v-for 已经完成渲染
            nextTick(() => {
                currentReport.vuls.forEach((vul, index) => {
                    createEditor(index);
                });
            });
        }
    });

    // 当抽屉关闭时，销毁所有编辑器实例以释放内存。
    watch(() => reportDrawer.value.visible, (isVisible) => {
        if (!isVisible) {
            destroyEditors();
        }
    });

    // 当漏洞列表的长度发生变化（增加或删除）时，
    // 销毁所有编辑器，让 watch(activeStep) 在 DOM 更新后重建它们。
    watch(() => currentReport.vuls.length, () => {
        destroyEditors();
        // 销毁后，如果仍在此步骤，需要手动触发一次重建
        if (activeStep.value === 1) {
             nextTick(() => {
                currentReport.vuls.forEach((vul, index) => {
                    createEditor(index);
                });
            });
        }
    });

    // --- 报告保存与下载 ---
    const saveReport = async () => {
        try {
            const url = currentReport.id ? `/api/reports/${currentReport.id}` : '/api/reports/';
            const method = currentReport.id ? 'put' : 'post';
            const response = await axios[method](url, currentReport);
            updateCurrentReportData(response.data);
            ElMessage.success('报告已保存');
            fetchReports();
        } catch (error) {
            ElMessage.error('保存失败');
        }
    };
    const generateAndDownload = async () => {
        try {
            await saveReport(); // 确保先保存最新数据
            if (!currentReport.id) {
                ElMessage.error('报告ID无效，请先保存报告');
                return;
            }
            
            ElMessage.info('正在生成报告，请稍候...');

            // 最终的、正确的下载逻辑：使用 axios 发起 POST 请求，并处理返回的 blob 文件流
            const response = await axios.post(
                `/api/reports/${currentReport.id}/generate/${selectedTemplate.value}`,
                {}, // POST 请求体为空
                { responseType: 'blob' } // 关键：告诉 axios 期望接收一个二进制对象
            );
            
            // 从响应头中尝试获取后端设置的文件名
            const contentDisposition = response.headers['content-disposition'];
            let friendlyFilename = '渗透测试报告.docx';
            if (contentDisposition) {
                // 改进的正则表达式，用于正确处理 filename 和 filename* 两种格式
                const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/);
                if (filenameMatch && filenameMatch.length > 1) {
                    // 使用 decodeURIComponent 来正确解码中文字符
                    friendlyFilename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', friendlyFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            reportDrawer.value.visible = false;
        } catch (error) {
            ElMessage.error('报告生成或下载失败');
            console.error(error);
        }
    };

    // --- 其他 ---
    const showPlaceholders = (row) => {
        placeholderDialog.value = {
            visible: true,
            title: `模板 [${row.name}] 的占位符`,
            data: row.placeholders,
        };
    };
    const showVulnerabilityLibrary = () => {
        vulnerabilityLibraryVisible.value = true;
    };
    const addVulnerabilitiesFromLibrary = (selectedVuls) => {
        currentReport.vuls.push(...selectedVuls);
        ElMessage.success(`成功添加 ${selectedVuls.length} 个漏洞`);
    };

    onMounted(() => {
        fetchTemplates();
        fetchReports();
    });

    return {
        templates, reports, reportDrawer, activeStep, currentReport, selectedTemplate,
        activeVulnerability, placeholderDialog, vulnerabilityLibraryVisible, overallRiskLevel,
        fetchTemplates, fetchReports, handleTemplateSuccess, handleTemplateError,
        deleteTemplate, deleteReport, newReport, editReport, nextStep, prevStep,
        addVulnerability, removeVulnerability, addTarget, removeTarget, addMember, removeMember,
        generateAndDownload, saveReport, showPlaceholders, showVulnerabilityLibrary,
        addVulnerabilitiesFromLibrary,
    };
  }
};