const Guide = {
  template: `
    <div class="guide-page">
        <el-page-header @back="goBack" content="漏洞资料指北"></el-page-header>
        
        <div class="guide-controls" style="margin-bottom: 30px;">
            <el-input
                v-model="searchQuery"
                placeholder="搜索漏洞名称..."
                clearable
                style="width: 300px; margin-right: 10px;">
            </el-input>
            <el-button type="primary" @click="openTemplateDialog()">新增模板</el-button>
        </div>

        <el-table :data="filteredTableData" style="width: 100%" border height="calc(100vh - 250px)">
            <el-table-column type="expand">
                <template #default="props">
                    <div class="expand-content">
                        <h4>测试指南</h4>
                        <pre>{{ props.row.test_guide }}</pre>
                        <h4>修复建议</h4>
                        <pre>{{ props.row.recommendation }}</pre>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="漏洞名称" width="250"></el-table-column>
            <el-table-column prop="risk_level" label="风险等级" width="120">
                 <template #default="scope">
                    <el-tag :type="getRiskTagType(scope.row.risk_level)">
                        {{ scope.row.risk_level }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="description" label="漏洞描述"></el-table-column>
            <el-table-column label="操作" width="150">
                <template #default="scope">
                    <el-button size="small" @click="openTemplateDialog(scope.row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteTemplate(scope.row.id)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <el-pagination
            background
            layout="prev, pager, next, total"
            :total="pagination.total"
            :current-page="pagination.currentPage"
            :page-size="pagination.pageSize"
            @current-change="handlePageChange"
            style="margin-top: 15px; justify-content: flex-end;"
        >
        </el-pagination>

        <!-- 新增/编辑模板对话框 -->
        <el-dialog v-model="templateDialog.visible" :title="templateDialog.title" width="60%">
            <el-form :model="currentTemplate" label-position="top">
                <el-form-item label="漏洞名称">
                    <el-input v-model="currentTemplate.name"></el-input>
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" @click="generateWithAI" :loading="aiLoading">使用 AI 生成</el-button>
                   <el-button @click="testAIConnection" :loading="testLoading">测试连接</el-button>
                </el-form-item>
                <el-form-item label="风险等级">
                    <el-select v-model="currentTemplate.risk_level" placeholder="选择风险等级">
                        <el-option label="高" value="高"></el-option>
                        <el-option label="中" value="中"></el-option>
                        <el-option label="低" value="低"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="漏洞描述">
                    <el-input v-model="currentTemplate.description" type="textarea" :rows="4"></el-input>
                </el-form-item>
                <el-form-item label="测试指南">
                    <el-input v-model="currentTemplate.test_guide" type="textarea" :rows="6"></el-input>
                </el-form-item>
                <el-form-item label="安全建议">
                    <el-input v-model="currentTemplate.recommendation" type="textarea" :rows="6"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="templateDialog.visible = false">取消</el-button>
                    <el-button type="primary" @click="saveTemplate">保存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
  `,
  setup() {
    const { ref, reactive, onMounted, computed } = Vue;
    const router = VueRouter.useRouter();
    const { ElMessage, ElMessageBox } = ElementPlus;

    const allTemplates = ref([]); // Store all templates from the backend
    const searchQuery = ref('');
    const templateDialog = ref({ visible: false, title: '新增漏洞模板' });
    const currentTemplate = ref({});
    const aiLoading = ref(false);
    const testLoading = ref(false);
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    });

    const goBack = () => router.push('/');

    const getRiskTagType = (riskLevel) => {
        switch (riskLevel) {
            case '高': return 'danger';
            case '中': return 'warning';
            case '低': return 'info';
            default: return 'primary';
        }
    };

    const fetchAllTemplates = async () => {
        try {
            // Fetch ALL templates without pagination by setting a large limit
            const response = await axios.get('/api/vulnerability-templates/', { params: { limit: 1000 } });
            allTemplates.value = response.data.templates;
            pagination.total = response.data.total;
        } catch (error) {
            console.error('Failed to load vulnerability templates:', error);
            ElMessage.error('加载知识库数据失败');
        }
    };

    onMounted(fetchAllTemplates);
    
    const filteredTableData = computed(() => {
        const filtered = allTemplates.value.filter(item =>
            !searchQuery.value || item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
        pagination.total = filtered.length;
        return filtered.slice((pagination.currentPage - 1) * pagination.pageSize, pagination.currentPage * pagination.pageSize);
    });

    const handlePageChange = (newPage) => {
        pagination.currentPage = newPage;
    };

    const openTemplateDialog = (template = null) => {
        if (template) {
            templateDialog.value.title = '编辑漏洞模板';
            currentTemplate.value = { ...template };
        } else {
            templateDialog.value.title = '新增漏洞模板';
            currentTemplate.value = {
                name: '',
                risk_level: '中',
                description: '',
                test_guide: '',
                recommendation: ''
            };
        }
        templateDialog.value.visible = true;
    };

    const saveTemplate = async () => {
        try {
            if (currentTemplate.value.id) {
                await axios.put(`/api/vulnerability-templates/${currentTemplate.value.id}`, currentTemplate.value);
                ElMessage.success('模板更新成功');
            } else {
                await axios.post('/api/vulnerability-templates/', currentTemplate.value);
                ElMessage.success('模板新增成功');
            }
            templateDialog.value.visible = false;
            fetchAllTemplates(); // Refresh data
        } catch (error) {
            console.error('Failed to save template:', error);
            ElMessage.error('保存模板失败');
        }
    };

    const deleteTemplate = async (id) => {
        try {
            await ElMessageBox.confirm('此操作将永久删除该模板, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            });
            await axios.delete(`/api/vulnerability-templates/${id}`);
            ElMessage.success('删除成功');
            fetchAllTemplates(); // Refresh data
        } catch (error) {
            if (error !== 'cancel') {
                ElMessage.error('删除失败');
            }
        }
    };

   const generateWithAI = async () => {
       if (!currentTemplate.value.name) {
           ElMessage.warning('请输入漏洞名称');
           return;
       }
       aiLoading.value = true;
       try {
           const response = await axios.post('/api/vulnerability-templates/generate-ai-details', {
               vuln_name: currentTemplate.value.name
           });
           currentTemplate.value.description = response.data.description;
           currentTemplate.value.recommendation = response.data.recommendation;
       } catch (error) {
           console.error('Failed to generate with AI:', error);
           ElMessage.error('AI 生成失败，请查看控制台日志');
       } finally {
           aiLoading.value = false;
       }
    };

   const testAIConnection = async () => {
       testLoading.value = true;
       try {
           const response = await axios.post('/api/ai/test-config');
           ElMessage.success(response.data.message);
       } catch (error) {
           const errorMessage = error.response?.data?.detail || '测试失败，请查看控制台日志';
           ElMessage.error(errorMessage);
           console.error('AI connection test failed:', error);
       } finally {
           testLoading.value = false;
       }
     };

    return {
      goBack,
      aiLoading,
      testLoading,
      generateWithAI,
      testAIConnection,
      searchQuery,
      filteredTableData,
      getRiskTagType,
      templateDialog,
      currentTemplate,
      openTemplateDialog,
      saveTemplate,
      deleteTemplate,
      pagination,
      handlePageChange
    };
  }
};